import React from 'react';
import PropTypes from 'prop-types';
import { routerShape } from 'react-router';
import { connect } from 'react-redux';
import { denormalize } from 'normalizr';
import moment from 'moment';
import _ from 'lodash';
import Octicon from 'react-octicon';
import Table from '../../components/table';
import Alert from '../../components/console/alert';
import * as actions from '../../actions';
import * as schemas from '../../constants/schemas';
import {
  UserLabel,
  ApplicationLabel,
  ClusterLabel,
  EncryptedLabel,
} from '../../components/inline';
import { DESENSITIZED_TIP } from '../../constants/text';
import Timeline from '../../components/timeline';
import Button from '../../components/button';
import { parseData } from '../../components/utils';
import './audit.sass';
import DialogConfirm from '../../components/dialog/confirm';
import dialog from '../../services/dialog';
import AuditValueDetail from './audit-value-detail';
import { checkIsDesensitized, detectEncryptedData, getActionStringValue } from './utils';

class AuditTimeline extends React.Component {
  static propTypes = {
    router: routerShape.isRequired,
    onLoadInstanceTimelines: PropTypes.func.isRequired,
    onAuditRevert: PropTypes.func.isRequired,
    onClearAuditLogs: PropTypes.func.isRequired,
    dataList: PropTypes.arrayOf(schemas.AuditLog).isRequired,
    pageSize: PropTypes.number.isRequired,
    isFetching: PropTypes.bool.isRequired,
    hasNext: PropTypes.bool.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = { start: 0 };
  }

  componentDidMount() {
    this.contentNode.addEventListener('scroll', this.handleScroll);
    this.loadInstanceTimeline(true);
  }

  componentWillUnmount() {
    this.contentNode.removeEventListener('scroll', this.handleScroll);
    this.props.onClearAuditLogs();
  }

  loadInstanceTimeline = (init = false) => {
    const { router, pageSize } = this.props;
    const { applicationName, clusterName, instanceKey, instanceType } = router.params;
    this.setState((state) => {
      const start = init ? 0 : state.start + pageSize;
      return { start };
    }, () => {
      const { start } = this.state;
      this.props.onLoadInstanceTimelines(
        instanceType, applicationName, clusterName, instanceKey, start,
      );
    });
  };

  handleRefresh = () => {
    this.props.onClearAuditLogs();
    this.loadInstanceTimeline(true);
  };

  handleAuditRevert = async (value) => {
    const { instanceType, applicationName, clusterName, instanceKey } = this.props.router.params;
    await this.props.onAuditRevert(
      instanceType,
      applicationName,
      clusterName,
      instanceKey,
      value,
    );
    this.handleRefresh();
  };

  isElementAtBottom = (target, scrollThreshold = 1) => {
    const clientHeight = (target === document.body || target === document.documentElement)
      ? window.screen.availHeight : target.clientHeight;

    const scrolled = scrollThreshold * (target.scrollHeight - target.scrollTop);
    return scrolled <= clientHeight;
  }

  handleScroll = (event) => {
    const { target } = event;
    const { isFetching } = this.props;
    if (this.isElementAtBottom(target) && this.props.hasNext && !isFetching) {
      this.loadInstanceTimeline();
    }
  };

  renderValue = (audit, isEncrypted) => {
    const value = getActionStringValue(audit.actionData.data.new);
    if (isEncrypted) {
      return EncryptedLabel();
    }
    return <span className="audit-timeline__value">{value}</span>;
  };

  render() {
    let { dataList } = this.props;
    const { router, isFetching } = this.props;
    const { instanceType, applicationName, clusterName, instanceKey } = router.params;
    dataList = dataList
      .map(item => item.update('createdAt', v => new Date(Date.parse(v))))
      .map(item => item.update('actionData', v => parseData(v)))
      .map(item => item.update('actionData', v => _.mapKeys(v, (u, k) => _.camelCase(k))))
      .map(item => item.toJS());
    const path = `/application/${applicationName}/${instanceType}`;
    let newIsEncrypted = false;

    return (
      <div className="view-audit">
        <div className="view-audit__filter">
          <h3 className="audit-timeline-navigation__title">
            <ApplicationLabel value={applicationName} href={path}>
              <ClusterLabel value={clusterName} allowDefault />
            </ApplicationLabel>
            <i className="audit-timeline-navigation__breadcrumb" />
            <span>{instanceType}</span>
            <i className="audit-timeline-navigation__breadcrumb" />
            <span>{instanceKey}</span>
          </h3>
          <div className="pull-right"><Button onClick={this.handleRefresh}><Octicon name="sync" /></Button></div>
        </div>
        <div className="view-audit__content" ref={(node) => { this.contentNode = node; }}>
          <Table
            className="view-audit__table"
            loading={isFetching}
            loadingPosition="top"
          >
            <thead>
              <tr>
                <td>Time</td>
                <td>Value</td>
                <td>User</td>
                <td>IP</td>
                <td>Action</td>
              </tr>
            </thead>
            {dataList.length > 0
              && dataList.filter(audit => audit.actionData.data).length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan="5">
                      <Alert status="NoAuthError" message="" />
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  {dataList.map((audit, index) => {
                    const { data } = audit.actionData;
                    const isEncrypted = newIsEncrypted || detectEncryptedData(data.new);
                    newIsEncrypted = isEncrypted;
                    const isDesensitized = checkIsDesensitized(audit.actionData);
                    return (
                      <tr key={audit.id}>
                        <td>
                          <Timeline
                            title={moment(audit.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                            isLast={index === (dataList.length - 1)}
                          />
                        </td>
                        <td title={isDesensitized ? DESENSITIZED_TIP : ''}>
                          {!isDesensitized ? (
                            <AuditValueDetail>
                              <code className="wrapped-value detail">
                                {this.renderValue(audit, isEncrypted)}
                              </code>
                            </AuditValueDetail>
                          ) : (
                            <code className="desensitized-value">Desensitized Value</code>
                          )}
                        </td>
                        <td><UserLabel user={audit.user} /></td>
                        <td>{audit.remoteAddr}</td>
                        <td>
                          {!isDesensitized ? (
                            <Button
                              onClick={() => dialog.then(c => c.popup(
                                <DialogConfirm
                                  onYes={() => {
                                    this.handleAuditRevert(data.new);
                                    c.close();
                                  }}
                                  onNo={c.close}
                                  description={`revert ${instanceKey} to ${data.new}`}
                                />,
                              ))}
                              disabled={index === 0}
                            >revert
                            </Button>
                          ) : <Button disabled>revert</Button>}
                        </td>
                      </tr>
                    );
                  })
                }
                </tbody>
              )
            }
          </Table>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { entity, audit } = state;
  const dataList = denormalize(
    audit.getIn(['timeline', 'items']), [schemas.auditSchema], entity,
  ).toArray();

  const isFetching = audit.get('isFetching');
  const pageSize = audit.get('limit');
  const hasNext = (dataList.length % pageSize === 0);
  return { dataList, pageSize, hasNext, isFetching };
}

function mapDispatchToProps(dispatch) {
  return {
    onLoadInstanceTimelines: (
      instanceType,
      applicationName,
      clusterName,
      instanceKey,
      start,
    ) => {
      dispatch(actions.fetchInstanceTimeline(
        instanceType,
        applicationName,
        clusterName,
        instanceKey,
        start,
      ));
    },
    onAuditRevert: (
      instanceType,
      applicationName,
      clusterName,
      key,
      value,
    ) => {
      dispatch(actions.revertInstance(
        instanceType,
        applicationName,
        clusterName,
        key,
        value,
      ));
    },
    onClearAuditLogs: () => {
      dispatch(actions.discardAuditLogs());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AuditTimeline);
