import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import Octicon from 'react-octicon';
import './audit.sass';

export default function TimelineLabel({ application, cluster, instanceType, instanceName }) {
  return (
    <span className="inline-audit__timeline-icon">
      <Link
        to={`/application/${application}/audit/timeline/${instanceType}/${cluster}/${instanceName}`}
        title={`时光机: 显示 ${instanceType} ${application}-${cluster}-${instanceName} 的历史版本`}
      >
        <Octicon name="history" />
      </Link>
    </span>
  );
}

TimelineLabel.propTypes = {
  application: PropTypes.string.isRequired,
  cluster: PropTypes.string.isRequired,
  instanceType: PropTypes.string.isRequired,
  instanceName: PropTypes.string.isRequired,
};
