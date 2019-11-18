import React from 'react';
import PropTypes from 'prop-types';
import Octicon from 'react-octicon';
import Button from '../../../components/button';
import Table from '../../../components/table';
import StateSwitch from '../../../components/stateswitch';
import DialogConfirm from '../../../components/dialog/confirm';
import { DateTime, TimelineLabel, ClusterLabel } from '../../../components/inline';
import { ContainerId } from '../../../structures';
import { FEATURE_LIST } from '../../../constants/env';
import { getIDC } from '../../../components/utils';
import {
  BEACON_METAL_URL,
  BEACON_CONTAINER_URL,
  BEACON_TRACE_URL,
  CLUSTER_LINK_URL,
} from '../../../constants/hrefs';
import dialog from '../../../services/dialog';
import ClusterCell from './cluster-cell';
import { clusterShape, instanceShape } from './proptypes';
import './instance-table.sass';

const cx = 'service-instance-table';

export default class InstanceTable extends React.Component {
  static propTypes = {
    applicationName: PropTypes.string.isRequired,
    cluster: clusterShape.isRequired,
    alternativeClusterList: PropTypes.arrayOf(clusterShape).isRequired,
    instanceList: PropTypes.arrayOf(instanceShape).isRequired,
    haveChildrenClusterList: PropTypes.arrayOf(clusterShape).isRequired,
    isLoading: PropTypes.bool,
    isCollapsed: PropTypes.bool,
    onClickDeleteCluster: PropTypes.func,
    onClickDeleteInstance: PropTypes.func,
    onClickEditInstance: PropTypes.func,
    onClickUpdateState: PropTypes.func,
  };

  static defaultProps = {
    isLoading: false,
    onClickDeleteCluster() {},
    onClickDeleteInstance() {},
    onClickEditInstance() {},
    onClickUpdateState() {},
    isCollapsed: false,
  };

  constructor(props) {
    super(props);

    const { cluster } = props;
    this.state = {
      isCollapsed: Boolean(cluster.physicalName),
    };
  }

  componentWillReceiveProps(nextProps) {
    const { isCollapsed } = nextProps;
    this.state = { isCollapsed };
  }

  handleToggleCollasped = () => {
    const { isCollapsed } = this.state;
    this.setState({ isCollapsed: !isCollapsed });
  }

  handleToggleState = item => () => {
    const clusterName = this.props.cluster.name;
    const ident = `集群 ${clusterName} 中 IP 为 ${item.value.ip} 的服务实例`;
    const oldState = item.value.state || 'down';
    const newState = oldState === 'up' ? 'down' : 'up';
    dialog.then(c => c.popup(<DialogConfirm
      content={`确定要把${ident}从 ${oldState} 切换到 ${newState}?`}
      additionalDescription="高危操作提示: 该操作会立即影响线上流量。"
      onYes={() => {
        this.props.onClickUpdateState(item, newState);
        c.close();
      }}
      onNo={c.close}
    />));
  }

  renderClusterCell = () => {
    const {
      applicationName,
      cluster,
      alternativeClusterList,
      instanceList,
      haveChildrenClusterList,
      onClickDeleteCluster,
    } = this.props;
    const { isCollapsed } = this.state;
    return (
      <div className={`${cx}__headline`}>
        <div className={`${cx}__headline-title`}>
          {alternativeClusterList.filter(c => !haveChildrenClusterList.some(h => h.name === c.name))
            .map(alternativeCluster => (
              <ClusterCell
                key={alternativeCluster.name}
                applicationName={applicationName}
                cluster={alternativeCluster}
                onClickDelete={onClickDeleteCluster}
                showApplication
              />))}
          <ClusterCell
            applicationName={applicationName}
            cluster={cluster}
            onClickDelete={onClickDeleteCluster}
            showApplication
          />
        </div>
        {instanceList.length > 0 && (
          <div className={`${cx}__headline-button`}>
            <Button
              onClick={this.handleToggleCollasped}
              type={isCollapsed ? 'primary' : 'default'}
            >
              {isCollapsed ? '展开' : '折叠'}
            </Button>
          </div>
        )}
      </div>
    );
  }

  renderInstanceBeacon = (item, containerId) => {
    let beaconUrl = BEACON_TRACE_URL(item.value.ip);
    let beaconIcon = 'ghost';
    let beaconText = '查找该 IP 所属的物理机、VM 或容器 (该实例没有上报 FQDN)';

    if (containerId.isEmpty) {
      if (item.value.meta && item.value.meta.host) {
        const hostname = item.value.meta.host.replace(/\.example\.com\.?$|\.?$/i, '');
        beaconUrl = BEACON_METAL_URL(hostname);
        beaconIcon = 'redhat';
        beaconText = '查看运行该实例的物理机或 VM 的基础监控';
      }
    } else {
      beaconUrl = BEACON_CONTAINER_URL(containerId.toString());
      beaconIcon = 'docker';
      beaconText = '查看运行该实例的容器';
    }

    const beaconCx = (
      `${cx}__beacon-icon ${cx}__beacon-icon--${beaconIcon} icon-${beaconIcon}`
    );

    if (beaconUrl === null) {
      return (
        <span className={`${cx}__beacon-link`}>
          <i className={beaconCx} />
        </span>
      );
    }

    return (
      <a
        href={beaconUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${cx}__beacon-link`}
        title={beaconText}
      >
        <i className={beaconCx} />
      </a>
    );
  }

  renderInstanceRow = (item) => {
    const { onClickEditInstance, onClickDeleteInstance, isLoading } = this.props;
    const containerId = ContainerId.parse(item.key);
    const idc = getIDC(item.value.ip);
    return (
      <tr key={item.key} className={`${cx}__item`}>
        <td className={`${cx}__item-key`}>
          {this.renderInstanceBeacon(item, containerId)}
          {containerId.isEmpty ? (
            <span className={`${cx}__key`} title={item.key}>{item.key}</span>
          ) : (
            <span className={`${cx}__key ${cx}__key--docker`} title={item.key}>
              {containerId.get('id')}
            </span>
          )}
        </td>
        <td className={`${cx}__item-ip`}>
          {item.value.ip || '-'}{idc && <span className={`${cx}__item-ip-idc`}>{`[${idc}]`}</span>}
        </td>
        <td className={`${cx}__item-port`}>
          {(item.value.port || {}).main || '-'}
        </td>
        <td className={`${cx}__item-meta`}>
          {(item.value.meta || {}).protocol || '-'}
        </td>
        <td
          className={`${cx}__item-state`}
          title={`${item.value.state === 'up' ? '暂时摘除节点、切断流量' : '恢复节点流量'}`}
        >
          <StateSwitch
            value={item.value.state || 'down'}
            onValue="up"
            offValue="down"
            onChange={this.handleToggleState(item)}
            disabled={!FEATURE_LIST.stateswitch && item.value.state === 'up'}
          />
        </td>
        <td className={`${cx}__item-date`}>
          <DateTime value={new Date(item.meta.created)} />
        </td>
        <td className={`${cx}__item-date`}>
          <DateTime value={new Date(item.meta.lastModified)} />
        </td>
        <td className={`${cx}__item-action`}>
          <Button
            title="编辑服务实例注册信息"
            onClick={onClickEditInstance(item)}
            disabled={isLoading}
            type="default"
          >
            <Octicon name="pencil" />
          </Button>
          <Button
            title="注销服务实例"
            onClick={onClickDeleteInstance(item)}
            disabled={isLoading}
            type="default"
          >
            <Octicon name="trashcan" />
          </Button>
          <Button>
            <TimelineLabel
              instanceType="service"
              application={item.application}
              cluster={item.cluster}
              instanceName={item.key}
            />
          </Button>
        </td>
      </tr>
    );
  }

  renderInstanceTable = () => {
    const { instanceList, cluster } = this.props;
    const { isCollapsed } = this.state;
    if (instanceList.length === 0 || isCollapsed) {
      return null;
    }
    const { physicalName } = cluster;
    return (
      <div className={physicalName && 'service-instance-table__table--linked'}>
        <Table>
          <thead>
            <tr>
              <td className="service-instance-table__thead-key">Key</td>
              <td className="service-instance-table__thead-ip">IP 地址</td>
              <td className="service-instance-table__thead-port">主端口</td>
              <td className="service-instance-table__thead-proto">协议</td>
              <td className="service-instance-table__thead-state">节点状态</td>
              <td className="service-instance-table__thead-created">创建时间</td>
              <td className="service-instance-table__thead-updated">更新时间</td>
              <td className="service-instance-table__thead-actions" />
            </tr>
          </thead>
          <tbody className={physicalName && 'service-instance-table__tbody--linked'}>
            {physicalName && (
              <tr className="service-instance-table__link_tip">
                <td colSpan="8">
                  当前集群软链到了 <ClusterLabel value={physicalName} /> 集群，
                  服务发现时将使用 <ClusterLabel value={physicalName} /> 集群下的服务信息。
                  关于集群软链的相关知识详见
                  <a target="_blank" rel="noopener noreferrer" href={CLUSTER_LINK_URL}>
                    Wiki
                  </a>
                </td>
              </tr>
            )}
            {instanceList.map(this.renderInstanceRow)}
          </tbody>
        </Table>
      </div>
    );
  }

  render() {
    return (
      <div className={cx}>
        {this.renderClusterCell()}
        {this.renderInstanceTable()}
      </div>
    );
  }
}
