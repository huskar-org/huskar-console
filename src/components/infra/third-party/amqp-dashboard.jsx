import React from 'react';
import PropTypes from 'prop-types';
import { InfraConfigItem, InfraConfigTypes } from '../../../structures';
import './amqp-dashboard.sass';

export default function AmqpDashboard({ value, onCancel }) {
  const applicationName = value.getUrlMap().url || {};
  const url = InfraConfigTypes.dashboardUrls[value.infraType](applicationName);
  return (
    <div className="amqp-dashboard">
      {url ? (
        <a
          className="amqp-dashboard__button"
          href={url}
          onClick={onCancel}
          target="_blank"
          rel="noopener noreferrer"
        >
          前往 AMQP 仪表盘
        </a>
      ) : (
        <span className="amqp-dashboard__invalid">
          无法生成 AMQP 仪表盘的 URL
        </span>
      )}
    </div>
  );
}

AmqpDashboard.propTypes = {
  value: PropTypes.instanceOf(InfraConfigItem).isRequired,
  onCancel: PropTypes.func,
};

AmqpDashboard.defaultProps = {
  onCancel: () => null,
};
