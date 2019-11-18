import React from 'react';
import PropTypes from 'prop-types';
import Octicon from 'react-octicon';
import _ from 'lodash';
import { connect } from 'react-redux';
import { locationShape } from 'react-router';
import {
  ApplicationLabel, ZoneLabel, RouteStatus,
} from '../../../components/inline';
import Button from '../../../components/button';
import TextField from '../../../components/textfield';
import Alert from '../../../components/alert';
import DialogConfirm from '../../../components/dialog/confirm';
import { isMultiplexRouting } from '../../../components/utils';
import dialog from '../../../services/dialog';
import comfilter from '../../../decorators/comfilter';
import { DEFAULT_CLUSTER, CLUSTER_SPEC_URL } from '../../../constants/env';
import {
  MISSING_DEFAULT_CLUSTER_WARNING,
  DEPRECATED_APPLICATION,
} from '../../../constants/text';
import * as hrefs from '../../../constants/hrefs';
import * as schemas from '../../../constants/schemas';
import * as actions from '../../../actions';
import { WellKnownData } from '../../../structures';
import InfoEditor from './info/editor';
import Editor from './editor';
import { instanceShape, clusterShape } from './proptypes';
import InstanceTable from './instance-table';
import './index.sass';

class Service extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    // The "location" prop is used inside async function
    // https://github.com/yannickcr/eslint-plugin-react/issues/1583
    // eslint-disable-next-line react/no-unused-prop-types
    location: locationShape.isRequired,
    params: PropTypes.shape({
      applicationName: PropTypes.string.isRequired,
    }).isRequired,
    application: PropTypes.shape({
      isInfra: PropTypes.bool.isRequired,
      isDeprecated: PropTypes.bool.isRequired,
    }).isRequired,
    onLoad: PropTypes.func.isRequired,
    onCreateService: PropTypes.func.isRequired,
    onDeleteService: PropTypes.func.isRequired,
    onCreateCluster: PropTypes.func.isRequired,
    onDeleteCluster: PropTypes.func.isRequired,
    onUpdateServiceState: PropTypes.func.isRequired,
    isFetching: PropTypes.bool.isRequired,
    isChanging: PropTypes.bool.isRequired,
    instanceList: PropTypes.arrayOf(instanceShape).isRequired,
    emptyClusterList: PropTypes.arrayOf(clusterShape).isRequired,
    internalClusterList: PropTypes.arrayOf(clusterShape).isRequired,
    haveChildrenClusterList: PropTypes.arrayOf(clusterShape).isRequired,
    clusterMap: PropTypes.objectOf(clusterShape).isRequired,
    symlinkClusterMap: PropTypes.objectOf(
      PropTypes.arrayOf(clusterShape),
    ).isRequired,
    wellKnownData: PropTypes.instanceOf(WellKnownData).isRequired,
    error: PropTypes.shape({
      status: PropTypes.string,
      message: PropTypes.string,
    }),
  };

  static defaultProps = {
    children: null,
    error: null,
  };

  state = {
    infoShown: false,
  };

  componentDidMount() {
    this.handleRefresh();
  }

  async componentWillReceiveProps(nextProps) {
    const { applicationName } = this.props.params;
    const nextApplicationName = nextProps.params.applicationName;
    if (applicationName !== nextApplicationName) {
      return this.props.onLoad(nextApplicationName);
    }

    // Show a dialog according to the query string
    const { query } = this.props.location;
    const { infoShown } = this.state;
    if (typeof query.info !== 'undefined' && !infoShown) {
      const handler = this.handleClickEditInfo(query.info ? query.info : null);
      await handler();
      this.setState({ infoShown: true }); // only show once
    }
    return true;
  }

  handleCollapse = status => () => {
    this.setState({ isCollapse: status });
  };

  handleClickRefresh = () => {
    this.handleRefresh();
  };

  handleRefresh = () => {
    const { onLoad, params: { applicationName } } = this.props;
    onLoad(applicationName);
  };

  handleClickEditInfo = (clusterName = null) => async (event) => {
    const { applicationName } = this.props.params;
    if (event) {
      event.preventDefault();
    }
    (await dialog).popup(
      <InfoEditor applicationName={applicationName} clusterName={clusterName} />,
    );
  };

  handleClickDeleteCluster = (event, cluster) => {
    const { applicationName } = this.props.params;
    event.preventDefault();
    dialog.then(c => c.popup(<DialogConfirm
      description={`remove cluster ${cluster.name}`}
      onYes={() => {
        this.props.onDeleteCluster(applicationName, cluster.name);
        c.close();
      }}
      onNo={c.close}
    />));
  };

  handleClickCreate = () => {
    const editor = (
      <Editor
        title="Create service instance or cluster"
        onSubmit={this.handleSubmitClusterOrInstance()}
      />
    );
    dialog.then(c => c.popup(editor));
  };

  handleClickEditInstance = item => () => {
    const defaultValue = {
      cluster: item.cluster,
      key: item.key,
      ip: item.value.ip,
      port: item.value.port || {},
      state: item.value.state || 'down',
      meta: item.value.meta || {},
    };
    const editor = (
      <Editor
        title={`Edit service instance ${item.key}`}
        key={item.cluster + item.key}
        onSubmit={this.handleSubmitClusterOrInstance(item.meta && item.meta.version)}
        defaultValue={defaultValue}
        isEditing
      />
    );
    dialog.then(c => c.popup(editor));
  };

  handleClickDeleteInstance = item => async () => {
    dialog.then(c => c.popup(<DialogConfirm
      onYes={() => {
        this.props.onDeleteService(item.application, item.cluster, item.key);
        c.close();
      }}
      onNo={c.close}
    />));
  };

  handleClickUpdateState = (item, state) => {
    const { onUpdateServiceState } = this.props;
    onUpdateServiceState(
      item.application, item.cluster, item.key, state,
      item.meta && item.meta.version,
    );
  };

  handleSubmitClusterOrInstance = version => (data, clusterOnly) => {
    const { cluster, key, ip, port, state, meta } = data;
    const { applicationName } = this.props.params;
    const clusterName = cluster.toString();
    const value = JSON.stringify({ ip, port, state, meta });

    if (clusterOnly) {
      this.props.onCreateCluster(applicationName, clusterName);
    } else {
      this.props.onCreateService(applicationName, clusterName, { key, value }, version);
    }
  };

  renderInstanceTable = ([clusterName, instanceList], index) => {
    const { isFetching, isChanging, clusterMap, symlinkClusterMap,
      haveChildrenClusterList } = this.props;
    const { applicationName } = this.props.params;
    const cluster = clusterMap[clusterName];
    if (!cluster) {
      return null;
    }
    const alternativeClusterList = (symlinkClusterMap[cluster.name] || []);
    return (
      <div className={`service__cluster ${cluster.physicalName && 'service__cluster--link'}`} key={clusterName}>
        <InstanceTable
          applicationName={applicationName}
          cluster={cluster}
          alternativeClusterList={alternativeClusterList}
          instanceList={instanceList.filter(i => i.key !== '__fake__')}
          haveChildrenClusterList={haveChildrenClusterList}
          isLoading={isFetching || isChanging}
          showLoading={index === 0}
          onClickDeleteCluster={this.handleClickDeleteCluster}
          onClickDeleteInstance={this.handleClickDeleteInstance}
          onClickEditInstance={this.handleClickEditInstance}
          onClickUpdateState={this.handleClickUpdateState}
          isCollapsed={this.state.isCollapse}
        />
      </div>
    );
  };

  renderEmptyCluster = (cluster) => {
    const { isFetching, isChanging, symlinkClusterMap } = this.props;
    const { applicationName } = this.props.params;
    const alternativeClusterList = (symlinkClusterMap[cluster.name] || []);
    return (
      <div className="service__cluster service__cluster--empty" key={cluster.name}>
        <InstanceTable
          applicationName={applicationName}
          cluster={cluster}
          alternativeClusterList={alternativeClusterList}
          instanceList={[]}
          haveChildrenClusterList={[]}
          isLoading={isFetching || isChanging}
          onClickDeleteCluster={this.handleClickDeleteCluster}
        />
      </div>
    );
  };

  renderDefaultClusterNotice = () => {
    if (this.props.error) return null;
    const { application, clusterMap } = this.props;
    let defaultCluster = clusterMap[DEFAULT_CLUSTER];
    if (defaultCluster && defaultCluster.physicalName) {
      defaultCluster = clusterMap[defaultCluster.physicalName];
    }
    const shouldDisplay = (
      DEFAULT_CLUSTER && !application.isInfra
      && (!defaultCluster || defaultCluster.meta.instanceCount === 0));

    if (!shouldDisplay) {
      return null;
    }
    return (
      <Alert type="error">
        <span>
          {MISSING_DEFAULT_CLUSTER_WARNING(DEFAULT_CLUSTER)}{' '}
          <a href={CLUSTER_SPEC_URL} className="service__alertLink">详情</a>
        </span>
      </Alert>
    );
  };

  renderDeprecationNotice = () => {
    const { application } = this.props;
    if (!application.isDeprecated) {
      return null;
    }
    return (
      <Alert type="warning">
        <span>{DEPRECATED_APPLICATION(application.name)}</span>
      </Alert>
    );
  }

  render() {
    if (this.props.children) {
      return this.props.children;
    }
    const {
      instanceList,
      internalClusterList,
      emptyClusterList,
      isFetching,
      isChanging,
      application,
      error,
      wellKnownData,
    } = this.props;
    const { applicationName } = this.props.params;
    const isFrozen = isFetching || isChanging;
    const isLoading = isFetching || isChanging;
    const instanceListGroups = _.toPairs(
      _.groupBy(instanceList.filter(this.filter), 'cluster'),
    );

    return (
      <div className="service__top service__modal-outer">
        <div className="service__filter">
          <span className="service__breadcrumb">
            <ApplicationLabel value={applicationName} />
          </span>
          <TextField name="cluster" placeholder="cluster filter" onChange={this.onFilterChange} />
          <TextField name="key" placeholder="key filter" onChange={this.onFilterChange} />
          <span className="service__indicators">
            <span className="service__indicators__label">
              <span>SOA Route (</span>
              <a
                href={hrefs.ROUTE_PROGRAM_WIKI.USER_MANUAL}
                target="_blank"
                rel="noopener noreferrer"
                className="service__indicators__link"
                title="点击查看 SOA Route 用户手册"
              >
                手册
              </a>
              <span>/</span>
              <a
                href={`/route-program?application=${applicationName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="service__indicators__link"
                title="点击查看 SOA Route 开启详情"
              >
                详情
              </a>
              <span>) :</span>
            </span>
            {_.toPairs(application.routeStage).sort().map(([ezone, value], i) => {
              const hijackMode = value || wellKnownData.getRouteDefaultHijackMode(ezone);
              return (
                <span className="service__indicators__value" key={`${ezone}-${hijackMode}`}>
                  {i !== 0 && <i className="service__indicators__separator" />}
                  <span className="service__indicators__ezone">
                    <ZoneLabel value={ezone} allowUndeclared />
                  </span>
                  <RouteStatus
                    value={hijackMode}
                    ezone={ezone}
                    title="点击查看详情"
                    href={`/route-program?application=${applicationName}`}
                  />
                </span>
              );
            })}
          </span>
          <div className="service__buttons">
            <div>
              <Button
                onClick={this.handleClickEditInfo()}
                disabled={isFrozen}
                type="default"
              >
                元信息
              </Button>
              <Button
                onClick={this.handleClickCreate}
                disabled={isFrozen}
                type="default"
              >
                创建集群或实例
              </Button>
              <Button
                onClick={this.handleClickRefresh}
                title="刷新服务列表"
              >
                <Octicon name="sync" />
              </Button>
            </div>

            <div className="service__buttons__collapse">
              <Button
                onClick={this.handleCollapse(false)}
                type="primary"
              >
                {'展开全部集群'}
              </Button>

              <Button
                onClick={this.handleCollapse(true)}
                type="default"
              >
                {'折叠全部集群'}
              </Button>
            </div>
          </div>

        </div>

        {error && <Alert type="error"><span>{error.message}</span></Alert>}
        {this.renderDefaultClusterNotice()}
        {this.renderDeprecationNotice()}

        {isLoading && (
          <div className="service__modal">
            <div className="service__modal-inner">
              <i className="service__modal-icon service__modal-icon--loading" />
            </div>
          </div>
        )}
        <div className="service__content">
          {instanceListGroups.map(this.renderInstanceTable)}

          {internalClusterList.length > 0 && (
            <div className="service__below">
              There are internal clusters below{' '}
              <Octicon name="squirrel" />
            </div>
          )}
          {internalClusterList
            .filter(cluster => this.filter({ cluster: cluster.name }))
            .map(this.renderEmptyCluster)}

          {emptyClusterList.length > 0
            && <div className="service__below">There are empty clusters below</div>}
          {emptyClusterList
            .filter(cluster => this.filter({ cluster: cluster.name }))
            .map(this.renderEmptyCluster)}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { applicationName } = ownProps.params;
  const applicationSelector = schemas.applicationItemSelector(
    applicationName, new schemas.Application(),
  );
  const instanceListSelector = schemas.instanceListSelector('service', applicationName);
  const clusterListSelector = schemas.clusterListSelector('service', applicationName);
  const isApplicationFetchingSelector = schemas.applicationLoadingSelector(
    applicationName,
  );
  const isFetchingSelector = schemas.instanceFetchingSelector('service');
  const isChangingSelector = schemas.instanceChangingSelector('service');
  const errorSelector = schemas.instanceErrorSelector('service');
  const error = errorSelector(state);

  const application = applicationSelector(state).toJS();
  const clusterList = error ? [] : clusterListSelector(state).toJS();
  const clusterMap = error ? {} : _.fromPairs(clusterList.map(c => [c.name, c]));
  const symlinkClusterMap = _.groupBy(clusterList
    .filter(c => c.physicalName), 'physicalName');
  let internalClusterList = clusterList
    .filter(c => isMultiplexRouting(c.physicalName));

  let instanceList = error ? [] : instanceListSelector(state).toJS();
  const missingPhysicalNames = [];
  instanceList.forEach((i) => {
    const physicalName = clusterMap[i.cluster] && clusterMap[i.cluster].physicalName;
    if (physicalName) {
      if (!instanceList.some(s => s.cluster === physicalName)) {
        if (!missingPhysicalNames.includes(physicalName)) {
          missingPhysicalNames.push(physicalName);
        }
      }
    }
  });
  missingPhysicalNames.forEach((name) => {
    instanceList.push({
      type: 'service',
      cluster: name,
      key: '__fake__',
    });
  });
  instanceList = _.sortBy(instanceList, [
    i => ((clusterMap[i.cluster] && clusterMap[i.cluster].physicalName)
      ? clusterMap[i.cluster].physicalName : i.cluster),
    i => ((clusterMap[i.cluster] && clusterMap[i.cluster].physicalName) ? 0 : 1),
  ]);

  const haveChildrenClusterList = instanceList.map(i => clusterMap[i.cluster]).filter(c => c);
  const emptyClusterList = clusterList
    .filter(c => (!c.physicalName && c.meta.instanceCount === 0) || (
      c.physicalName && !clusterMap[c.physicalName]))
    .filter(c => !haveChildrenClusterList.includes(c))
    .filter(c => !internalClusterList.includes(c));
  internalClusterList = internalClusterList.filter(c => !haveChildrenClusterList.includes(c));

  const isFetching = isFetchingSelector(state) || isApplicationFetchingSelector(state);
  const isChanging = isChangingSelector(state);
  const wellKnownData = schemas.wellKnownDataSelector(state);

  return {
    application,
    instanceList,
    clusterMap,
    symlinkClusterMap,
    emptyClusterList,
    internalClusterList,
    haveChildrenClusterList,
    isFetching,
    isChanging,
    wellKnownData,
    error,
  };
}

function mapDispatchToProps(dispatch) {
  const type = 'service';
  return {
    onLoad: (application) => {
      dispatch(actions.fetchApplication(application));
      dispatch(actions.fetchApplicationInstances(type, application));
    },
    onCreateService: (application, cluster, data, version) => {
      dispatch(actions.createInstance(type, application, cluster, data, version));
    },
    onDeleteService: (application, cluster, key) => {
      dispatch(actions.deleteInstance(type, application, cluster, key));
    },
    onUpdateServiceState: (application, cluster, key, state, version) => {
      dispatch(actions.updateServiceState(application, cluster, key, state, version));
    },
    onCreateCluster: (application, cluster) => {
      dispatch(actions.createCluster(type, application, cluster));
    },
    onDeleteCluster: (application, cluster) => {
      dispatch(actions.deleteCluster(type, application, cluster));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(comfilter(Service));
