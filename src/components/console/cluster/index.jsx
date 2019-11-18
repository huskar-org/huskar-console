import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Octicon from 'react-octicon';
import Immutable from 'immutable';
import FileSaver from 'file-saver';
import _ from 'lodash';
import Table from '../../table';
import Upload from '../../upload';
import Button from '../../button';
import {
  ApplicationLabel,
  ClusterLabel,
  IntentLabel,
  RouteTypeLabel,
  ZoneLabel,
  ClusterSelecter,
} from '../../inline';
import { isMultiplexRouting, handlePressEnterKey } from '../../utils';
import TextField from '../../textfield';
import AutoComplete from '../../autocomplete';
import DialogConfirm from '../../dialog/confirm';
import InfoEditor from '../../../views/instance/service/info/editor';
import { Cluster, WellKnownData } from '../../../structures';
import { OVERALL_CLUSTER } from '../../../constants/common';
import {
  CROSS_ZONE_WARNING,
} from '../../../constants/text';
import { EZONE_LIST } from '../../../constants/env';
import {
  ROUTE_DISCOURAGED_PREFIX,
  ROUTE_DISCOURAGED_SUFFIX,
  ROUTE_INTENT_LABELS,
} from '../../../constants/ezone';
import api from '../../../services/api';
import dialog from '../../../services/dialog';
import * as schemas from '../../../constants/schemas';
import * as actions from '../../../actions';
import Dropdown from '../../dropdown';
import LinkEditor from './editor';
import dumpRouteForExport from './utils';
import './index.sass';

class ClusterEditor extends React.Component {
  static propTypes = {
    loading: PropTypes.bool.isRequired,
    params: PropTypes.shape({
      applicationName: PropTypes.string,
      clusterName: PropTypes.string,
    }),
    applicationList: PropTypes.arrayOf(PropTypes.instanceOf(schemas.Application)).isRequired,
    clusterList: PropTypes.arrayOf(PropTypes.string).isRequired,
    outgoingRoute: PropTypes.string.isRequired,
    incomingRoute: PropTypes.string.isRequired,
    incomingDefaultRoute: PropTypes.string.isRequired,
    incomingGlobalDefaultRoute: PropTypes.string.isRequired,
    clusterLink: PropTypes.string,
    onFetchServiceRoute: PropTypes.func.isRequired,
    onFetchClusterList: PropTypes.func.isRequired,
    onDeleteServiceRoute: PropTypes.func.isRequired,
    onUpdateServiceRoute: PropTypes.func.isRequired,
    onBatchUpdateServiceRoute: PropTypes.func.isRequired,
    onUpdateDefaultServiceRoute: PropTypes.func.isRequired,
    onDeleteDefaultServiceRoute: PropTypes.func.isRequired,
    wellKnownData: PropTypes.instanceOf(WellKnownData).isRequired,
  };

  static defaultProps = {
    params: {
      applicationName: '',
      clusterName: '',
    },
    clusterLink: null,
  };

  state = {
    applicationClusterList: [],
    applicationClusterLoading: false,
    creatingRoute: null,
    editingRoute: null,
    stashedRouteData: null,
    editingDefaultRoute: null,
    deletingDefaultRoute: null,
  };

  componentDidMount() {
    this.handleClickRefresh();
    this.applicationCandidates = [];
  }

  componentDidUpdate() {
    this.applicationCandidates = this.props.applicationList
      .map(application => application.get('name', '').trim())
      .filter(name => name)
      .filter(name => !ROUTE_DISCOURAGED_PREFIX.some(p => name.startsWith(p)))
      .filter(name => !ROUTE_DISCOURAGED_SUFFIX.some(p => name.endsWith(p)))
      .sort()
      .map(name => ({ name, value: name }));
  }

  handleRefreshRoute = () => {
    const { applicationName, clusterName } = this.props.params;
    this.props.onFetchServiceRoute(applicationName, clusterName);
  }

  handleRefreshClusterList = () => {
    const { applicationName } = this.props.params;
    this.props.onFetchClusterList(applicationName);
  }

  handleClickEditInfo = () => {
    const { applicationName, clusterName } = this.props.params;
    const editor = (
      <InfoEditor applicationName={applicationName} clusterName={clusterName} />
    );
    dialog.then(c => c.popup(editor));
  }

  handleClickEditLink = () => {
    const { applicationName, clusterName } = this.props.params;
    const { clusterLink, clusterList } = this.props;
    const { loadingLink } = this.state;

    if (loadingLink) {
      return;
    }

    const editor = (
      <LinkEditor
        applicationName={applicationName}
        clusterName={clusterName}
        clusterPhysicalName={clusterLink}
        clusterList={clusterList}
        onSubmit={this.handleRefreshClusterList}
      />
    );
    dialog.then(c => c.popup(editor));
  }

  handleClickEditRoute = (type, item) => () => {
    this.setState({
      editingRoute: { type, item },
      creatingRoute: null,
      stashedRouteData: null,
      applicationClusterLoading: false,
      applicationClusterList: [],
    });
    if (item) {
      this.handleRefreshCluster(item.get('applicationName'));
    }
  }

  handleClickIncomingRoute = item => this.handleClickEditRoute('incoming', item);

  handleClickOutgoingRoute = item => this.handleClickEditRoute('outgoing', item);

  handleClickCreateRoute = () => {
    this.setState({
      editingRoute: null,
      creatingRoute: { type: 'outgoing' },
      stashedRouteData: null,
      applicationClusterLoading: false,
      applicationClusterList: [],
    });
  }

  handleClickDiscardRoute = item => () => {
    this.setState({
      creatingRoute: null,
      editingRoute: null,
      stashedRouteData: null,
    });
    this.props.onDeleteServiceRoute(item.toJSON()).then(() => {
      this.handleClickRefresh();
    });
  }

  handleClickSaveRoute = () => {
    const { stashedRouteData } = this.state;
    this.props.onUpdateServiceRoute(stashedRouteData.toJSON()).then(() => {
      this.setState({
        stashedRouteData: null,
        editingRoute: null,
        creatingRoute: null,
      });
      this.handleClickRefresh();
    });
  }

  handleChangeStashedRouteData = (name, item, coerce) => (event, extraProps, extraKey, extraValue = '') => {
    let value = extraProps
      ? extraProps.inputValue.trim() : event.target.value.trim();
    if (coerce) {
      value = coerce(value);
    }
    this.setState((prevState) => {
      let stashedRouteData = (prevState.stashedRouteData || item.delete('id')).set(name, value);
      if (extraKey) {
        stashedRouteData = stashedRouteData.set(extraKey, extraValue);
      }
      return { stashedRouteData };
    });
  }

  handleChangeStashedRouteAppId = (name, item, coerce) => (event, extraProps) => {
    const key = name === 'applicationName' ? 'clusterName' : 'fromClusterName';
    this.handleChangeStashedRouteData(name, item, coerce)(event, extraProps, key);
    const { stashedRouteData } = this.state;
    this.handleRefreshCluster(stashedRouteData.get(name));
  }

  handleValidateUniqueEntry = () => {
    // Force to edit existed entry instead of creating a new one
    const { stashedRouteData } = this.state;
    if (stashedRouteData) {
      const existed = this.props.outgoingRoute
        .find(i => (
          i.get('applicationName') === stashedRouteData.get('applicationName')
          && i.get('intent') === (stashedRouteData.get('intent') || 'direct')
        ));
      if (existed) {
        const handler = this.handleClickOutgoingRoute(existed);
        handler();
      }
    }
  }

  handleRefreshCluster = (applicationName) => {
    this.setState({ applicationClusterLoading: true });
    api.service(applicationName).get().then((resp) => {
      if (resp.status !== 200) {
        this.setState({
          applicationClusterList: [],
          applicationClusterLoading: false,
        });
        return;
      }
      const infoList = resp.data.data;
      const applicationClusterList = infoList
        .map((i) => {
          const { clusterName, ezone } = Cluster.parse(i.name);
          return {
            cluster: clusterName,
            ezone,
            physicalName: i.physical_name,
            num: i.meta.instance_count || 0,
          };
        });
      this.setState({
        applicationClusterList,
        applicationClusterLoading: false,
      });
    });
  }

  handleCoerceClusterName = (clusterName) => {
    const { ezone } = Cluster.parse(this.props.params.clusterName);
    return new Cluster({ ezone, clusterName }).toString();
  }

  handleDidImport = (content, limitType) => {
    const { applicationName, clusterName } = this.props.params;
    const routeList = content.map((item) => {
      if (item.type !== limitType) {
        return null;
      }

      if (item.type === 'outgoing') {
        const destCluster = Cluster.parse(clusterName).set(
          'clusterName', item.cluster_name,
        ).normalize();
        return Object.assign({}, item, {
          from_application_name: applicationName,
          from_cluster_name: clusterName,
          cluster_name: destCluster.toString(),
        });
      } if (item.type === 'incoming') {
        const destCluster = Cluster.parse(clusterName);
        if (item.application_name !== applicationName
          || item.cluster_name !== destCluster.clusterName) {
          return null;
        }
        const fromCluster = Cluster.parse(item.from_cluster_name).set(
          'ezone', destCluster.ezone,
        ).normalize();
        return Object.assign({}, item, {
          from_cluster_name: fromCluster.toString(),
          cluster_name: clusterName,
        });
      }
      return null;
    }).filter(r => r);
    this.props.onBatchUpdateServiceRoute(applicationName, clusterName, routeList).then(() => {
      this.handleClickRefresh();
    }).catch(() => {
      this.handleClickRefresh();
    });
  }

  handleUploadConfirmed = (payload, limitType) => {
    try {
      const data = JSON.parse(payload);
      if (data.version === 'v2' && data.type === 'route') {
        this.handleDidImport(data.content, limitType);
      } else {
        dialog.then(c => c.popup(<DialogConfirm
          canChoose={false}
          content={`不支持的文件内容: ${data.type}-${data.version}-${limitType}`}
          onYes={c.close}
        />));
      }
    } catch (e) {
      dialog.then(c => c.popup(<DialogConfirm
        canChoose={false}
        content={`未知文件格式 (${e.toString()})`}
        onYes={c.close}
      />));
    }
  }

  handleClickImport = type => () => (
    type === 'incoming' ? this.uploadIncoming.click() : this.uploadOutgoing.click()
  )

  handleClickExport = () => {
    const { applicationName, clusterName } = this.props.params;
    const { incomingRoute } = this.props;
    api.serviceroute(applicationName)(clusterName).get().then((resp) => {
      const outgoingData = resp.data.data.route
        .filter(item => item.cluster_name !== null)
        .map(item => dumpRouteForExport({
          type: 'outgoing',
          fromApplicationName: applicationName,
          fromClusterName: clusterName,
          intent: item.intent,
          applicationName: item.application_name,
          clusterName: item.cluster_name,
        }));
      const content = outgoingData.concat(...incomingRoute.filter(item => (
        item.get('applicationName') === applicationName && item.get('clusterName') === clusterName
      )).map(item => dumpRouteForExport({
        type: 'incoming',
        fromApplicationName: item.get('fromApplicationName'),
        fromClusterName: item.get('fromClusterName'),
        intent: item.get('intent'),
        applicationName: item.get('applicationName'),
        clusterName: item.get('clusterName'),
      })));
      const fileName = `${applicationName}-route@${clusterName}.json`;
      const text = JSON.stringify({ version: 'v2', type: 'route', content }, null, 2);
      const type = 'application/octet-stream';
      const blob = new Blob([text], { type });
      FileSaver.saveAs(blob, fileName, true);
    });
  }

  handleClickCrossZoneAnnotation = (fromZone, toZoneList) => () => {
    dialog.then(c => c.popup(<DialogConfirm
      canChoose={false}
      content={CROSS_ZONE_WARNING(fromZone, toZoneList)}
      onYes={c.close}
    />));
  }

  handleClickRefresh = () => {
    this.handleRefreshClusterList();
    this.handleRefreshRoute();
  }

  handleClickEditDefaultRoute = item => () => {
    const editingDefaultRoute = item === null ? null : new Immutable.Map({
      ezone: item.get('ezone'),
      intent: item.get('intent'),
    });
    this.setState({ editingDefaultRoute });
    this.handleRefreshCluster(this.props.params.applicationName);
  }

  handleClickSaveDefaultRoute = item => () => {
    const { editingDefaultRoute } = this.state;
    const { applicationName, clusterName } = this.props.params;
    this.props.onUpdateDefaultServiceRoute(
      applicationName,
      clusterName,
      editingDefaultRoute.get('clusterName') || item.get('clusterName'),
      editingDefaultRoute.get('ezone'),
      editingDefaultRoute.get('intent'),
    ).then(() => {
      this.setState({ editingDefaultRoute: null });
    });
  }

  handleClickDiscardDefaultRoute = item => () => {
    const { applicationName, clusterName } = this.props.params;
    this.props.onDeleteDefaultServiceRoute(
      applicationName,
      clusterName,
      item.get('ezone'),
      item.get('intent'),
    );
  }

  handleChangeDefaultRoute = item => (event) => {
    const cluster = Cluster.parse(event.target.value.trim());
    const editingDefaultRoute = new Immutable.Map({
      ezone: item.get('ezone'),
      intent: item.get('intent'),
      clusterName: cluster.clusterName,
    });
    this.setState({ editingDefaultRoute });
  }

  handleChangeRouteType = (event) => {
    const type = event.target.value.trim();
    const { creatingRoute } = this.state;
    const newCreatingRoute = Object.assign({}, creatingRoute, { type });
    this.setState({
      stashedRouteData: null,
      creatingRoute: newCreatingRoute,
      applicationClusterList: [],
    });
  }

  getForceRoutingClusterName = (cluster, intent) => {
    const { wellKnownData } = this.props;
    const forceClusterName = intent ? `${cluster}@${intent}` : cluster;
    return wellKnownData.getForceRoutingClusters(forceClusterName);
  }

  renderOutgoingRoute = (item) => {
    const { applicationName, clusterName } = this.props.params;
    const { editingRoute, creatingRoute, applicationClusterLoading, stashedRouteData } = this.state;
    const cluster = Cluster.parse(clusterName);
    const isEditing = (
      editingRoute && editingRoute.type === 'outgoing'
      && editingRoute.item && editingRoute.item.get('id') === item.get('id'));
    const isCreating = item.get('id') === this.props.outgoingRoute.size;
    const isConfirmable = (
      stashedRouteData
      && stashedRouteData.every(x => x.trim())
    );
    const highlightItem = this.state.stashedRouteData || item;
    let applicationClusterList = [];
    if (isEditing || isCreating) {
      ({ applicationClusterList } = this.state);
    }
    const forceRoutingClusterName = this.getForceRoutingClusterName(clusterName, isCreating ? highlightItem.get('intent') || 'direct' : item.get('intent'));
    applicationClusterList = forceRoutingClusterName ? applicationClusterList
      .filter(i => i.cluster === forceRoutingClusterName) : applicationClusterList;

    return (
      <tr
        className={[
          'cluster-editor-content__row',
          isCreating && 'cluster-editor-content__row--creating',
          isEditing && 'cluster-editor-content__row--editing',
        ].filter(x => x).join(' ')}
        key={`outgoing-item-${item.get('id')}`}
        title="Outgoing 出站流量特定目标规则"
      >
        <td>
          <RouteTypeLabel
            value={isCreating ? creatingRoute.type : 'outgoing'}
            editable={isCreating && creatingRoute.type === 'outgoing'}
            onChange={this.handleChangeRouteType}
          />
        </td>
        <td>
          <ApplicationLabel value={applicationName}>
            <ClusterLabel value={cluster} />
          </ApplicationLabel>
        </td>
        <td>
          <IntentLabel
            value={isCreating ? highlightItem.get('intent') : item.get('intent')}
            editable={isCreating}
            onChange={this.handleChangeStashedRouteData('intent', item)}
          />
        </td>
        <td>
          {isCreating || isEditing
            ? (
              <span className="cluster-editor-content__input-wrapper">
                <label htmlFor={`outgoing-item-application-name-${item.get('id')}`}>
                  <span className="cluster-editor-content__input-label">
                    Application Name
                  </span>
                  {isCreating ? (
                    <AutoComplete
                      id={`outgoing-item-application-name-${item.get('id')}`}
                      className="cluster-editor-content__input-value"
                      inputClassName="cluster-editor-content__input"
                      defaultValue={highlightItem.get('applicationName')}
                      onBlur={this.handleValidateUniqueEntry}
                      candidates={this.applicationCandidates}
                      onChange={_.debounce(this.handleChangeStashedRouteAppId('applicationName', item), 500)}
                    />
                  ) : (
                    <ApplicationLabel
                      className="cluster-editor-content__input-value"
                      value={item.get('applicationName')}
                    />
                  )}
                </label>
              </span>
            )
            : (
              <ApplicationLabel value={item.get('applicationName')}>
                <ClusterLabel value={forceRoutingClusterName || item.get('clusterName') || OVERALL_CLUSTER} allowDefault={!item.get('clusterName')} />
              </ApplicationLabel>
            )}
          {isEditing || isCreating
            ? (
              <span className="cluster-editor-content__input-wrapper">
                <label htmlFor={`outgoing-item-cluster-name-${item.get('id')}`}>
                  <span className="cluster-editor-content__input-label">
                    Cluster Name
                  </span>
                  <ClusterSelecter
                    id={`outgoing-item-cluster-name-${item.get('id')}`}
                    className="cluster-editor-content__input-value"
                    onChange={this.handleChangeStashedRouteData(
                      'clusterName', item, this.handleCoerceClusterName,
                    )}
                    clusterList={applicationClusterList}
                    value={Cluster.parse((highlightItem.get('clusterName') && forceRoutingClusterName) || highlightItem.get('clusterName') || '').clusterName}
                    loading={applicationClusterLoading}
                    applicationName={highlightItem.get('applicationName')}
                    isCreating={isCreating}
                    ezone={cluster.ezone.name}
                  />
                  {applicationClusterLoading && (
                    <i className="cluster-editor-content__input-icon cluster-editor-content__input-icon--loading" />
                  )}
                </label>
              </span>
            ) : null}
        </td>
        {isEditing || isCreating
          ? (
            <td>
              <Button
                className="cluster-editor-content__btn"
                onClick={this.handleClickSaveRoute}
                disabled={!isConfirmable}
                type="danger"
                effect="delay"
              >
                <Octicon name="check" />
              </Button>
              <Button
                className="cluster-editor-content__btn"
                onClick={this.handleClickOutgoingRoute(null)}
              >
                <Octicon name="x" />
              </Button>
            </td>
          )
          : (
            <td>
              <Button
                className="cluster-editor-content__btn"
                disabled={forceRoutingClusterName}
                onClick={this.handleClickOutgoingRoute(item)}
              >
                <Octicon name="pencil" />
              </Button>
              <Button
                className="cluster-editor-content__btn"
                tip="长按删除"
                type="danger"
                effect="delay"
                onClick={this.handleClickDiscardRoute(item)}
              >
                <Octicon name="trashcan" />
              </Button>
            </td>
          )}
      </tr>
    );
  };

  renderIncomingRoute = (item) => {
    const { clusterName } = this.props.params;
    const { editingRoute, creatingRoute, applicationClusterLoading, stashedRouteData } = this.state;
    const cluster = Cluster.parse(clusterName);
    const enableHandle = cluster.ezone === Cluster.parse(item.get('clusterName')).ezone;
    const isDeactivated = !enableHandle || item.get('clusterName') !== clusterName;
    const isEditing = (
      editingRoute && editingRoute.type === 'incoming'
      && editingRoute.item && editingRoute.item.get('id') === item.get('id'));
    const isCreating = item.get('id') === this.props.incomingRoute.size;
    const highlightItem = stashedRouteData || item;
    const isConfirmable = (
      stashedRouteData
      && stashedRouteData.every(x => x.trim())
    );
    let applicationClusterList = [];
    if (isEditing || isCreating) {
      ({ applicationClusterList } = this.state);
    }
    const forceRoutingClusterName = this.getForceRoutingClusterName(item.get('clusterName'), isCreating ? highlightItem.get('intent') || 'direct' : item.get('intent'));
    let editNotice = null;
    if (forceRoutingClusterName) {
      editNotice = '强制路由集群无法修改规则';
    } else if (!enableHandle) {
      editNotice = '请跳转至相应ezone下的集群进行编辑操作';
    }
    return (
      <tr
        className={[
          'cluster-editor-content__row',
          isCreating && 'cluster-editor-content__row--creating',
          isEditing && 'cluster-editor-content__row--editing',
          isDeactivated && 'cluster-editor-content__row--deactivated',
        ].filter(x => x).join(' ')}
        key={`incoming-item-${item.get('id')}`}
        title="Incoming 入站流量特定来源规则"
      >
        <td>
          <RouteTypeLabel
            value={isCreating ? creatingRoute.type : 'incoming'}
            editable={isCreating && creatingRoute.type === 'incoming'}
            onChange={this.handleChangeRouteType}
          />
        </td>
        <td>
          {isCreating ? (
            <span className="cluster-editor-content__input-wrapper">
              <label htmlFor={`incoming-item-application-name-${item.get('id')}`}>
                <span className="cluster-editor-content__input-label">
                  Application Name
                </span>
                <AutoComplete
                  id={`incoming-item-application-name-${item.get('id')}`}
                  className="cluster-editor-content__input-value"
                  inputClassName="cluster-editor-content__input"
                  defaultValue={highlightItem.get('fromApplicationName')}
                  candidates={this.applicationCandidates}
                  onChange={_.debounce(this.handleChangeStashedRouteAppId('fromApplicationName', item), 500)}
                />
                {''}
              </label>
            </span>
          ) : (
            <ApplicationLabel value={item.get('fromApplicationName')}>
              <ClusterLabel value={item.get('fromClusterName')} />
            </ApplicationLabel>
          )}
          {isCreating && (
            <span className="cluster-editor-content__input-wrapper">
              <label htmlFor={`incoming-item-cluster-name-${item.get('id')}`}>
                <span className="cluster-editor-content__input-label">
                  Cluster Name
                </span>
                <ClusterSelecter
                  id={`incoming-item-cluster-name-${item.get('id')}`}
                  className="cluster-editor-content__input-value"
                  onChange={this.handleChangeStashedRouteData(
                    'fromClusterName', item, this.handleCoerceClusterName,
                  )}
                  clusterList={applicationClusterList}
                  loading={applicationClusterLoading}
                  applicationName={highlightItem.get('fromApplicationName')}
                  isCreating={isCreating}
                  value={Cluster.parse(highlightItem.get('fromClusterName') || '').clusterName}
                  numCheck={false}
                  showLink={false}
                  ezone={cluster.ezone.name}
                />
                {applicationClusterLoading && (
                  <i className="cluster-editor-content__input-icon cluster-editor-content__input-icon--loading" />
                )}
              </label>
            </span>
          )}
        </td>
        <td>
          <IntentLabel
            value={isCreating ? highlightItem.get('intent') : item.get('intent')}
            editable={isCreating}
            onChange={this.handleChangeStashedRouteData('intent', item)}
          />
        </td>
        <td>
          {isEditing ? (
            <span className="cluster-editor-content__input-wrapper">
              <span className="cluster-editor-content__input-label">
                Application Name
              </span>
              <ApplicationLabel
                className="cluster-editor-content__input-value"
                value={item.get('applicationName')}
              />
            </span>
          ) : (
            <ApplicationLabel value={item.get('applicationName')}>
              <ClusterLabel value={forceRoutingClusterName || item.get('clusterName')} />
            </ApplicationLabel>
          )}
          {isEditing
            ? (
              <span className="cluster-editor-content__input-wrapper">
                <label htmlFor={`incoming-item-cluster-name-${item.get('id')}`}>
                  <span className="cluster-editor-content__input-label">
                    Cluster Name
                  </span>
                  <ClusterSelecter
                    id={`incoming-item-cluster-name-${item.get('id')}`}
                    className="cluster-editor-content__input-value"
                    onChange={this.handleChangeStashedRouteData(
                      'clusterName', item, this.handleCoerceClusterName,
                    )}
                    clusterList={applicationClusterList}
                    value={Cluster.parse(highlightItem.get('clusterName') || '').clusterName}
                    loading={applicationClusterLoading}
                    ezone={cluster.ezone.name}
                  />
                  {applicationClusterLoading
                  && <i className="cluster-editor-content__input-icon cluster-editor-content__input-icon--loading" />}
                </label>
              </span>
            ) : null}
        </td>
        {isCreating || isEditing
          ? (
            <td>
              <Button
                className="cluster-editor-content__btn"
                onClick={this.handleClickSaveRoute}
                disabled={!isConfirmable}
                type="danger"
                effect="delay"
              >
                <Octicon name="check" />
              </Button>
              <Button
                className="cluster-editor-content__btn"
                onClick={this.handleClickIncomingRoute(null)}
              >
                <Octicon name="x" />
              </Button>
            </td>
          )
          : (
            <td>
              <Button
                className="cluster-editor-content__btn"
                onClick={this.handleClickIncomingRoute(item)}
                disabled={forceRoutingClusterName ? true : !enableHandle}
                title={editNotice}
              >
                <Octicon name="pencil" />
              </Button>
              <Button
                className="cluster-editor-content__btn"
                tip="长按删除"
                type="danger"
                effect="delay"
                onClick={this.handleClickDiscardRoute(item)}
                disabled={!enableHandle}
                title={!enableHandle ? '请跳转至相应ezone下的集群进行删除操作' : null}
              >
                <Octicon name="trashcan" />
              </Button>
            </td>
          )}
      </tr>
    );
  }

  renderDefaultRoute = () => {
    const { applicationName } = this.props.params;
    const { incomingDefaultRoute, incomingGlobalDefaultRoute } = this.props;
    const {
      editingDefaultRoute,
      deletingDefaultRoute,
    } = this.state;

    if (incomingGlobalDefaultRoute.size === 0) {
      return [];
    }

    const intentList = new Immutable.List(Object.keys(ROUTE_INTENT_LABELS));
    const defaultRouteList = new Immutable.List(EZONE_LIST)
      .map(ezone => (ezone === 'global' ? OVERALL_CLUSTER : ezone))
      .map(ezone => intentList.map(intent => [ezone, intent]))
      .flatten(1)
      .map(([ezone, intent]) => {
        const route = incomingDefaultRoute.get(ezone, new Immutable.Map());
        let clusterName = route.get(intent);
        let isFallback = false;
        if (!clusterName) {
          clusterName = incomingDefaultRoute
            .get(OVERALL_CLUSTER, incomingGlobalDefaultRoute)
            .get(intent);
          isFallback = true;
        }
        if (
          ezone === OVERALL_CLUSTER
          && clusterName === incomingGlobalDefaultRoute.get(intent)
        ) {
          isFallback = true;
        }
        return new Immutable.Map({ ezone, intent, clusterName, isFallback });
      })
      .map(item => item.set('isEditing', (
        editingDefaultRoute
        && editingDefaultRoute.get('ezone') === item.get('ezone')
        && editingDefaultRoute.get('intent') === item.get('intent')
      )))
      .map(item => item.set('isDeleting', (
        deletingDefaultRoute
        && deletingDefaultRoute.get('ezone') === item.get('ezone')
        && deletingDefaultRoute.get('intent') === item.get('intent')
      )));
    let applicationClusterList = [];
    let applicationClusterLoading = false;
    if (editingDefaultRoute) {
      ({ applicationClusterList, applicationClusterLoading } = this.state);
    }
    return defaultRouteList.map(item => (
      <tr
        className={[
          'cluster-editor-content__row',
          item.get('isEditing') && 'cluster-editor-content__row--editing',
        ].filter(x => x).join(' ')}
        key={`default-route-${item.get('ezone')}-${item.get('intent')}`}
        title="Incoming 入站流量默认规则"
      >
        <td>Incoming</td>
        <td>
          {item.get('ezone') === OVERALL_CLUSTER
            ? <ClusterLabel value={OVERALL_CLUSTER} allowDefault />
            : <ZoneLabel value={item.get('ezone')} allowUndeclared />}
        </td>
        <td><IntentLabel value={item.get('intent')} /></td>
        <td>
          {item.get('isEditing')
            ? (
              <span className="cluster-editor-content__input-wrapper">
                <span className="cluster-editor-content__input-label">
                  Application Name
                </span>
                <ApplicationLabel
                  className="cluster-editor-content__input-value"
                  value={applicationName}
                />
              </span>
            )
            : (
              <ApplicationLabel value={applicationName}>
                {item.get('ezone') === OVERALL_CLUSTER
                  ? <ClusterLabel value={item.get('clusterName') || ''} />
                  : <ClusterLabel value={`${item.get('ezone')}-${item.get('clusterName')}`} />}
              </ApplicationLabel>
            )}
          {item.get('isEditing') && item.get('ezone') === OVERALL_CLUSTER && (
            <span className="cluster-editor-content__input-wrapper">
              <label htmlFor={`default-item-cluster-name-${item.get('id')}`}>
                <span className="cluster-editor-content__input-label">
                  Cluster Name
                </span>
                <TextField
                  id={`default-item-cluster-name-${item.get('id')}`}
                  className="cluster-editor-content__input"
                  value={editingDefaultRoute.get('clusterName') || item.get('clusterName')}
                  onChange={this.handleChangeDefaultRoute(item)}
                />
                {''}
              </label>
            </span>
          )}
          {item.get('isEditing') && item.get('ezone') !== OVERALL_CLUSTER && (
            <span className="cluster-editor-content__input-wrapper">
              <label htmlFor={`default-item-cluster-name-${item.get('id')}`}>
                <span className="cluster-editor-content__input-label">
                  Cluster Name
                </span>
                <ClusterSelecter
                  id={`default-item-cluster-name-${item.get('id')}`}
                  className="cluster-editor-content__input"
                  onChange={this.handleChangeDefaultRoute(item)}
                  clusterList={applicationClusterList}
                  value={editingDefaultRoute.get('clusterName') || item.get('clusterName')}
                  loading={applicationClusterLoading}
                  ezone={item.get('ezone')}
                />
                {''}
              </label>
            </span>
          )}
        </td>
        {item.get('isEditing')
          ? (
            <td>
              <Button
                className="cluster-editor-content__btn"
                onClick={this.handleClickSaveDefaultRoute(item)}
                type="danger"
                effect="delay"
              >
                <Octicon name="check" />
              </Button>
              <Button
                className="cluster-editor-content__btn"
                onClick={this.handleClickEditDefaultRoute(null)}
              >
                <Octicon name="x" />
              </Button>
            </td>
          )
          : (
            <td>
              <Button
                className="cluster-editor-content__btn"
                onClick={this.handleClickEditDefaultRoute(item)}
              >
                <Octicon name="pencil" />
              </Button>
              <Button
                className="cluster-editor-content__btn"
                tip="长按删除"
                type="danger"
                effect="delay"
                onClick={this.handleClickDiscardDefaultRoute(item)}
                disabled={item.get('isFallback')}
              >
                <Octicon name="trashcan" />
              </Button>
            </td>
          )}
      </tr>
    ));
  }

  render() {
    const { applicationName, clusterName } = this.props.params;
    const { loadingLink, creatingRoute } = this.state;
    const { outgoingRoute, incomingRoute, loading, clusterLink } = this.props;
    const clusterValue = Cluster.parse(clusterName);
    const clusterLinkValueList = (clusterLink || '').split('+').map(c => Cluster.parse(c));
    const clusterLinkCrossZone = (clusterLink && (
      clusterLinkValueList.length > 1
      || clusterValue.ezone !== clusterLinkValueList[0].ezone));

    let content = new Immutable.List().concat(
      outgoingRoute.map(this.renderOutgoingRoute),
      incomingRoute.map(this.renderIncomingRoute),
      this.renderDefaultRoute(),
    );

    const forceRouteNotice = ['direct', 'proxy'].map(i => ({
      intent: i,
      cluster: this.getForceRoutingClusterName(clusterName, i),
    })).filter(i => i.cluster);

    if (creatingRoute && creatingRoute.type === 'outgoing') {
      content = content.unshift(this.renderOutgoingRoute(new Immutable.Map({
        id: outgoingRoute.size,
        fromApplicationName: applicationName,
        fromClusterName: clusterName,
        applicationName: '',
        clusterName: '',
      })));
    } else if (creatingRoute && creatingRoute.type === 'incoming') {
      content = content.unshift(this.renderIncomingRoute(new Immutable.Map({
        id: incomingRoute.size,
        fromApplicationName: '',
        fromClusterName: '',
        applicationName,
        clusterName,
      })));
    }
    return (
      <div className="cluster-editor">
        <div className="cluster-editor-topbar">
          <h3 className="cluster-editor-topbar__title">
            <ApplicationLabel value={applicationName}>
              <ClusterLabel value={clusterName} />
            </ApplicationLabel>
            {clusterLink && isMultiplexRouting(clusterLink)
              && (
              <span
                className="cluster-editor-topbar__title-clusterlink cluster-editor-topbar__title-clusterlink--multiplex"
                title={clusterLink.split('+').join('\n')}
              >
                <Octicon name="squirrel" />
              </span>
              )}
            {clusterLink && !isMultiplexRouting(clusterLink)
              && (
              <span className="cluster-editor-topbar__title-clusterlink">
                <Octicon name="link" />
                <ClusterLabel value={clusterLink} />
              </span>
              )}
          </h3>
          <div className="cluster-editor-topbar__annotation">
            {clusterLinkCrossZone
              && (
              <span
                className="cluster-editor-topbar__annotation-cross-zone"
                title="Click to show the cross E-Zone warning"
                role="button"
                tabIndex="-1"
                onClick={this.handleClickCrossZoneAnnotation(
                  clusterValue.ezone, clusterLinkValueList.map(v => v.ezone),
                )}
                onKeyPress={handlePressEnterKey(this.handleClickCrossZoneAnnotation(
                  clusterValue.ezone, clusterLinkValueList.map(v => v.ezone),
                ))}
              >
                当前集群已配置跨 E-Zone 软链
              </span>
              )}
          </div>
          <div className="cluster-editor-topbar__action">
            <Button
              className="cluster-editor-topbar__btn"
              title="Edit the cluster info of Sam"
              onClick={this.handleClickEditInfo}
              disabled={isMultiplexRouting(clusterLink)}
            >
              元信息
            </Button>
            <Button
              className="cluster-editor-topbar__btn"
              title="Edit the cluster link"
              onClick={this.handleClickEditLink}
              disabled={isMultiplexRouting(clusterLink)}
            >
              {loadingLink
                && <i className="cluster-editor-topbar__btnspin" />}
              集群软链
            </Button>
          </div>
        </div>
        <div className="cluster-editor-content">
          {forceRouteNotice.length === 0 ? (
            <Table loading={loading}>
              <thead>
                <tr>
                  <td>类别</td>
                  <td>流量来源</td>
                  <td>调用 Intent</td>
                  <td>流量目标</td>
                  <td>
                    <Dropdown
                      dpButton={(
                        <Button
                          className="cluster-editor-content__btn"
                          type="default"
                          title="导入路由规则"
                        >
                          <Octicon name="cloud-upload" />
                        </Button>)}
                      pullRight
                    >
                      <div className="cluster-editor-content__import-selector">
                        <a
                          tabIndex={0}
                          href="#import-outgoing"
                          onClick={this.handleClickImport('outgoing')}
                          onKeyPress={handlePressEnterKey(this.handleClickImport('outgoing'))}
                        >
                          导入 Outgoing 路由
                        </a>
                        <a
                          tabIndex={0}
                          href="#import-incoming"
                          onClick={this.handleClickImport('incoming')}
                          onKeyPress={handlePressEnterKey(this.handleClickImport('incoming'))}
                        >
                          导入 Incoming 路由
                        </a>
                      </div>
                    </Dropdown>
                    <Button
                      className="cluster-editor-content__btn"
                      onClick={this.handleClickExport}
                      type="default"
                      title="导出路由规则"
                    >
                      <Octicon name="cloud-download" />
                    </Button>
                    <Upload
                      onUpload={data => this.handleUploadConfirmed(data, 'outgoing')}
                      ref={(ref) => { this.uploadOutgoing = ref; }}
                      contentFunc={file => `确定要从文件 "${file.name}" 中导入 Outgoing 路由规则？`}
                    />
                    <Upload
                      onUpload={data => this.handleUploadConfirmed(data, 'incoming')}
                      ref={(ref) => { this.uploadIncoming = ref; }}
                      contentFunc={file => `确定要从文件 "${file.name}" 中导入 Incoming 路由规则？`}
                    />

                    <i className="cluster-editor-content__sep" />

                    <Button
                      className="cluster-editor-content__btn"
                      onClick={this.handleClickRefresh}
                      title="Refresh the route policy"
                    >
                      <Octicon name="sync" />
                    </Button>
                    <Button
                      className="cluster-editor-content__btn"
                      onClick={this.handleClickCreateRoute}
                      disabled={creatingRoute}
                      title="Create a new route policy"
                    >
                      <Octicon name="plus" />
                    </Button>
                  </td>
                </tr>
              </thead>
              <tbody>
                {content}
              </tbody>
            </Table>
          ) : (
            <div className="cluster-editor-notice">
              <p className="cluster-editor-notice__text">
                <code className="cluster-editor-notice__code">
                  <span className="cluster-editor-notice__comment">
                    当前所在的
                    <span className="cluster-editor-notice__comment__red">
                      { clusterName }集群
                    </span>
                    开启了
                    <span className="cluster-editor-notice__comment__red">
                      强制路由规则
                    </span>
                    ，
                    <span className="cluster-editor-notice__comment__red">
                      无需手动配置
                    </span>
                    路由规则。
                    { forceRouteNotice.map(i => (
                      <span className="cluster-editor-notice__code">对于 intent 为 {i.intent} 的 Outgoing 规则，将
                        <span className="cluster-editor-notice__comment__red">
                          自动
                        </span>
                        并且
                        <span className="cluster-editor-notice__comment__red">
                          强制
                        </span>
                        路由到 {i.cluster} 集群。
                      </span>))}
                  </span>
                </code>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state, oweProps) {
  const { instance, serviceRoute } = state;
  const { applicationName, clusterName } = oweProps.params;
  const applicationList = schemas.applicationListSelector(state);

  const outgoingRoute = serviceRoute.get('outgoing') || new Immutable.List();
  const incomingDefaultRoute = serviceRoute.get('defaultIncoming') || new Immutable.Map();
  const incomingGlobalDefaultRoute = serviceRoute.get(
    'globalDefaultIncoming',
  ) || new Immutable.Map();

  const incomingRoute = instance.service
    .getIn(['clusters', applicationName], new Immutable.OrderedSet())
    .map(item => item.route.map(route => (new Immutable.Map({
      fromApplicationName: route.applicationName,
      fromClusterName: item.name,
      intent: route.intent,
      applicationName: item.application,
      clusterName: route.clusterName,
    }))))
    .reduce((a, b) => a.concat(b), new Immutable.List())
    .filter(item => item.get('fromApplicationName') !== applicationName)
    .map((item, idx) => item.set('id', idx))
    .sort();
  const loading = serviceRoute.get('loading', false) && instance.service.get('isFetching', false);
  const clusterLink = instance.service
    .getIn(['clusters', applicationName], new Immutable.OrderedSet())
    .filter(item => item.name === clusterName)
    .map(item => item.physicalName)
    .toJSON()[0] || null;
  const clusterList = instance.service
    .getIn(['clusters', applicationName], new Immutable.OrderedSet())
    .map(x => x.name)
    .toJSON();
  const wellKnownData = schemas.wellKnownDataSelector(state);

  return {
    loading,
    applicationList,
    outgoingRoute,
    incomingRoute,
    incomingDefaultRoute,
    incomingGlobalDefaultRoute,
    clusterLink,
    clusterList,
    wellKnownData,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onRefresh: (applicationName, clusterName) => {
      dispatch(actions.fetchServiceRoute(applicationName, clusterName));
      dispatch(actions.fetchClusterList('service', applicationName));
    },
    onFetchServiceRoute: (applicationName, clusterName) => dispatch(
      actions.fetchServiceRoute(applicationName, clusterName),
    ),
    onUpdateServiceRoute: ({
      fromApplicationName,
      fromClusterName,
      intent,
      applicationName,
      clusterName,
    }) => dispatch(actions.updateServiceRoute(
      fromApplicationName, fromClusterName, applicationName, clusterName, intent,
    )),
    onDeleteServiceRoute: ({
      fromApplicationName,
      fromClusterName,
      intent,
      applicationName,
    }) => {
      const action = actions.deleteServiceRoute(
        fromApplicationName, fromClusterName, applicationName, intent,
      );
      return dispatch(action);
    },
    onFetchClusterList: applicationName => dispatch(
      actions.fetchClusterList('service', applicationName),
    ),
    onUpdateDefaultServiceRoute: (
      applicationName, clusterName, destClusterName, ezone, intent,
    ) => dispatch(actions.updateServiceDefaultRoute(
      applicationName, clusterName, destClusterName, ezone, intent,
    )),
    onDeleteDefaultServiceRoute: (
      applicationName, clusterName, ezone, intent,
    ) => dispatch(actions.deleteServiceDefaultRoute(applicationName, clusterName, ezone, intent)),
    onBatchUpdateServiceRoute: (applicationName, clusterName, routeList) => dispatch(
      actions.batchUpdateServiceRoute(applicationName, clusterName, routeList),
    ),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ClusterEditor);
