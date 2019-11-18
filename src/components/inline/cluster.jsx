import React from 'react';
import PropTypes from 'prop-types';
import { Cluster } from '../../structures';
import { OVERALL_CLUSTER } from '../../constants/common';
import './cluster.sass';

export default function ClusterLabel({ value, allowDefault, instanceNum }) {
  const cluster = Cluster.parse(value);
  const title = cluster.isGlobal
    ? `undeclared ezone - ${cluster.clusterName}`
    : `${cluster.ezone.name} (${cluster.ezone.idc}) - ${cluster.clusterName}`;

  if (
    allowDefault && cluster.isGlobal
    && cluster.clusterName === OVERALL_CLUSTER
  ) {
    return (
      <span className="inline-cluster">
        <span className="inline-cluster__default">default</span>
      </span>
    );
  }

  return (
    <span className="inline-cluster" title={title}>
      {!cluster.isGlobal && (
        <span className="inline-cluster__ezone">
          {cluster.ezone.name}
        </span>
      )}
      <span
        className={[
          'inline-cluster__name',
          cluster.isGlobal
            ? 'inline-cluster__name--without-ezone'
            : 'inline-cluster__name--with-ezone',
        ].filter(x => x).join(' ')}
      >
        {cluster.clusterName}

        {instanceNum > 0 && (
          <span
            title={`${instanceNum} instances in this cluster`}
            className="inline-cluster__number"
          >
            ({instanceNum})
          </span>
        )}

      </span>

    </span>
  );
}

ClusterLabel.propTypes = {
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Cluster),
  ]).isRequired,
  allowDefault: PropTypes.bool,
  instanceNum: PropTypes.number,
};

ClusterLabel.defaultProps = {
  allowDefault: false,
  instanceNum: 0,
};
