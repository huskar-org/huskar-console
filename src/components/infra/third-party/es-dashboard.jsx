import React from 'react';
import PropTypes from 'prop-types';
import { InfraConfigItem, InfraConfigTypes } from '../../../structures';
import './es-dashboard.sass';

export default function ElasticsearchDashboard({ value, onCancel }) {
  const applicationName = value.getUrlMap().url || {};
  const url = InfraConfigTypes.dashboardUrls[value.infraType](applicationName);
  return (
    <div className="es-dashboard">
      {url ? (
        <a
          className="es-dashboard__button"
          href={url}
          onClick={onCancel}
          target="_blank"
          rel="noopener noreferrer"
        >
          前往 Elasticsearch 仪表盘
        </a>
      ) : (
        <span className="es-dashboard__invalid">
          无法生成 Elasticsearch 仪表盘的 URL
        </span>
      )}
    </div>
  );
}

ElasticsearchDashboard.propTypes = {
  value: PropTypes.instanceOf(InfraConfigItem).isRequired,
  onCancel: PropTypes.func,
};

ElasticsearchDashboard.defaultProps = {
  onCancel: () => null,
};
