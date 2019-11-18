import React from 'react';
import PropTypes from 'prop-types';
import Octicon from 'react-octicon';
import { Link } from 'react-router';
import { clusterShape } from './proptypes';
import { ApplicationLabel, ClusterLabel } from '../../../components/inline';
import { isMultiplexRouting } from '../../../components/utils';
import './cluster-cell.sass';

const cx = 'service-cluster-cell';

export default class ClusterCell extends React.Component {
  static propTypes = {
    applicationName: PropTypes.string.isRequired,
    cluster: clusterShape.isRequired,
    onClickDelete: PropTypes.func,
    showApplication: PropTypes.bool,
  };

  static defaultProps = {
    onClickDelete() {},
    showApplication: false,
  };

  handleClickDelete(cluster) {
    return event => this.props.onClickDelete(event, cluster);
  }

  renderLabel() {
    const { cluster, showApplication, applicationName } = this.props;
    if (showApplication) {
      return (
        <ApplicationLabel value={applicationName}>
          <ClusterLabel value={cluster.name} instanceNum={cluster.meta.instanceCount} />
        </ApplicationLabel>
      );
    }
    return <ClusterLabel value={cluster.name} instanceNum={cluster.meta.instanceCount} />;
  }

  renderIndicator() {
    const { cluster } = this.props;

    if (!cluster.physicalName) {
      return null;
    }

    if (isMultiplexRouting(cluster.physicalName)) {
      const clusterTips = (
        `"${cluster.name}" is an internal cluster with special routing actions.`
      );
      return (
        <span title={clusterTips} className={`${cx}__indicator ${cx}__indicator--multiplex`}>
          <Octicon name="squirrel" />
        </span>
      );
    }

    const clusterTips = (
      `"${cluster.name}" has been linked to "${cluster.physicalName}"`
    );

    return (
      <span title={clusterTips} className={`${cx}__indicator`}>
        <Octicon name="link" />
        <span className="physical-cluster-label">
          <ClusterLabel value={cluster.physicalName} />
        </span>
      </span>
    );
  }

  renderEditButton() {
    const { applicationName, cluster } = this.props;
    return (
      <Link
        to={`/application/${applicationName}/service/cluster/${cluster.name}`}
        className={`${cx}__button`}
        title="Edit the route, link or load balance info of this cluster"
      >
        <Octicon name="pencil" />
      </Link>
    );
  }

  renderDeleteButton() {
    const { cluster } = this.props;
    const canDelete = (
      cluster.meta.instanceCount === 0
      && cluster.physicalName === null
      && cluster.route.length === 0);

    if (!canDelete) {
      return null;
    }

    return (
      <a
        className={`${cx}__button`}
        title="Delete this cluster"
        onClick={this.handleClickDelete(cluster)}
        href="#delete-cluster"
      >
        <Octicon name="trashcan" />
      </a>
    );
  }

  render() {
    return (
      <div className={cx}>
        {this.renderLabel()}
        {this.renderIndicator()}
        {this.renderEditButton()}
        {this.renderDeleteButton()}
      </div>
    );
  }
}
