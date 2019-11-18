import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  ApplicationLabel,
  ZoneLabel,
  ClusterLabel,
  InfraTypeLabel,
  DateTime,
} from '../../components/inline';
import Table from '../../components/table';
import Button from '../../components/button';
import DialogConfirm from '../../components/dialog/confirm';
import dialog from '../../services/dialog';
import * as actions from '../../actions';
import * as schemas from '../../constants/schemas';
import * as text from '../../constants/text';
import './downstream.sass';

class InfraDownstream extends React.Component {
  static propTypes = {
    params: PropTypes.shape({
      applicationName: PropTypes.string,
    }).isRequired,
    application: PropTypes.instanceOf(schemas.Application),
    onFetch: PropTypes.func.isRequired,
    onInvalidate: PropTypes.func.isRequired,
    dataState: PropTypes.oneOf(['idle', 'loading', 'success', 'error']).isRequired,
    dataItems: PropTypes.arrayOf(PropTypes.instanceOf(schemas.InfraDownstream)).isRequired,
  };

  static defaultProps = {
    application: null,
  };

  componentDidMount() {
    const { onFetch, params } = this.props;
    const { applicationName } = params || {};
    onFetch(applicationName);
  }

  componentWillReceiveProps(nextProps) {
    const { onFetch, params } = nextProps;
    const { applicationName } = params || {};
    if (this.props.params.applicationName !== applicationName) {
      onFetch(applicationName);
    }
  }

  handleRefresh = () => {
    const { onFetch, params } = this.props;
    const { applicationName } = params || {};
    onFetch(applicationName);
  };

  handleInvalidate = () => {
    const { onInvalidate, params } = this.props;
    const { applicationName } = params || {};
    onInvalidate(applicationName);
  };

  handleMigrate = () => () => {
    dialog.then(c => c.popup(<DialogConfirm
      canChoose={false}
      content={text.INFRA_DOWNSTREAM_MIGRATION}
      onYes={c.close}
    />));
  };

  makeViewUrl = (item) => {
    const { userApplicationName, userInfraType, userInfraName } = item.toJS();
    const path = `/application/${userApplicationName}/config`
      + `?infra_type=${encodeURIComponent(userInfraType)}`
      + `&infra_name=${encodeURIComponent(userInfraName)}`;
    return path;
  };

  renderBody() {
    const { application, dataState, dataItems } = this.props;
    if (!application || !application.get('isInfra')) {
      return (
        <p className="infra-downstream__body infra-downstream__body--error">
          The application does not exist or is not an infrastructure.
        </p>
      );
    }
    if (dataState === 'error') {
      return (
        <p className="infra-downstream__body infra-downstream__body--error">
          Error occured on fetching downstream list.
        </p>
      );
    }
    return (
      <Table className="infra-downstream__body" loading={dataState !== 'success'}>
        <thead>
          <tr>
            <td>#</td>
            <td>Application</td>
            <td>Type</td>
            <td>Code Name</td>
            <td>E-Zone</td>
            <td>Last Update Time</td>
            <td />
          </tr>
        </thead>
        <tbody>
          {dataItems.map((item, idx) => (
            <tr
              key={item.id}
              id={`infra-downstream-${item.id}`}
              title={`Version: ${item.version}`}
            >
              <td>
                <a href={`#infra-downstream-${item.id}`} className="infra-downstream__anchor">
                  {idx + 1}
                  <i className="infra-downstream__icon-anchor" />
                </a>
              </td>
              <td><ApplicationLabel value={item.userApplicationName} /></td>
              <td>
                <InfraTypeLabel value={item.userInfraType} />
              </td>
              <td>
                <code className="infra-downstream__code-name">
                  {item.userInfraName}
                </code>
                {item.get('userFieldName') !== 'url' && (
                  <span className="infra-downstream__field-name">
                    {item.get('userFieldName')}
                  </span>
                )}
              </td>
              <td>
                {item.get('userScopeType') === 'idcs'
                  && <ZoneLabel value={item.get('userScopeName')} allowUndeclared />}
                {item.get('userScopeType') === 'clusters'
                  && <ClusterLabel value={item.get('userScopeName')} />}
              </td>
              <td><DateTime value={item.updatedAt} /></td>
              <td className="infra-downstream__operation">
                <a
                  className="infra-downstream__button-link"
                  href={this.makeViewUrl(item)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View
                </a>
                <Button
                  className="infra-downstream__button"
                  onClick={this.handleMigrate(item)}
                >
                  Migrate
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  }

  render() {
    const { applicationName } = this.props.params || {};
    return (
      <div className="infra-downstream">
        <div className="infra-downstream__topbar">
          <div className="infra-downstream__topbar-left">
            <ApplicationLabel value={applicationName} />
          </div>
          <div className="infra-downstream__topbar-right">
            <Button className="infra-downstream__button" onClick={this.handleInvalidate}>
              <i className="infra-downstream__icon-invalidate" />
              Invalidate Cache
            </Button>
            <Button className="infra-downstream__button" onClick={this.handleRefresh}>
              <i className="infra-downstream__icon-refresh" />
              Refresh
            </Button>
          </div>
        </div>
        {this.renderBody()}
      </div>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { applicationName } = ownProps.params || {};
  const applicationSelector = schemas.applicationItemSelector(applicationName);
  const application = applicationSelector(state);
  const dataState = schemas.infraDownstreamStateSelector(state);
  const dataItems = schemas.infraDownstreamItemsSelector(state);
  return { application, dataState, dataItems };
}

function mapDispatchToProps(dispatch) {
  return {
    onFetch(applicationName) {
      dispatch(actions.fetchInfraDownstream(applicationName));
    },
    onInvalidate(applicationName) {
      dispatch(actions.invalidateInfraDownstream(applicationName));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(InfraDownstream);
