import React from 'react';
import PropTypes from 'prop-types';
import { Cluster } from '../../structures';
import { OVERALL_CLUSTER } from '../../constants/common';
import './cluster-selecter.sass';


export default function ClusterSelecter(props) {
  const { value, loading, isCreating, applicationName, numCheck, showLink, clusterList } = props;
  let { ezone } = props;
  ezone = ezone === OVERALL_CLUSTER ? null : ezone;
  let showClusterList = clusterList.filter(c => c.ezone.name === ezone);
  showClusterList = showClusterList.map((i) => {
    const tmp = Object.assign({}, i);
    if (showLink && tmp.physicalName !== null) {
      const physicalCluster = clusterList.filter((t) => {
        const cluster = Cluster.parse(tmp.physicalName);
        if (t.cluster === cluster.clusterName && t.ezone === cluster.ezone) {
          return true;
        }
        return false;
      })[0];
      if (physicalCluster && physicalCluster.num) {
        tmp.num = physicalCluster.num;
      }
    }
    return tmp;
  }).sort((a, b) => b.num - a.num);
  const hasUsable = !loading && showClusterList.length === 0 && applicationName !== '';
  const hasOldValue = showClusterList.map(i => i.cluster)
    .indexOf(value) < 0 && !loading && !isCreating;
  return (
    <select
      id={props.id}
      className={props.className}
      onChange={props.onChange}
      value={value}
    >
      {isCreating && showClusterList.length !== 0 && <option value="" className="cluster-selecter__option-hide">请选择集群</option>}
      {hasOldValue && <option value={value === '' ? null : value}> {value === '' ? '默认集群' : `${value} (0)`} </option>}
      {showClusterList.map(i => (
        <option
          value={i.cluster}
          disabled={numCheck && i.num === 0 && i.cluster !== value}
        >
          {i.cluster} {showLink && i.physicalName ? `-> ${i.physicalName} (${i.num})` : `(${i.num})`}
        </option>
      ))}
      {hasUsable && !hasOldValue && <option value="">无可用集群</option>}
    </select>
  );
}

ClusterSelecter.propTypes = {
  id: PropTypes.string,
  className: PropTypes.string,
  value: PropTypes.string,
  applicationName: PropTypes.string,
  ezone: PropTypes.string,
  clusterList: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  isCreating: PropTypes.bool,
  onChange: PropTypes.func,
  numCheck: PropTypes.bool,
  showLink: PropTypes.bool,
};

ClusterSelecter.defaultProps = {
  id: '',
  className: '',
  value: '',
  applicationName: '',
  clusterList: [],
  ezone: null,
  onChange: null,
  loading: false,
  isCreating: false,
  numCheck: true,
  showLink: true,
};
