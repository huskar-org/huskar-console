import React from 'react';
import PropTypes from 'prop-types';
import './route-status.sass';

const ROUTE_STATUS_LIST = {
  D: { name: 'disabled', text: '未灰度', description: e => `该应用在 ${e} 上没有加入灰度` },
  C: { name: 'checking', text: '观察中', description: e => `该应用在 ${e} 上正在准备加入灰度, 暂时没有开启 SOA Route` },
  E: { name: 'enabled', text: '灰度中', description: e => `该应用在 ${e} 上加入了灰度, 并且已经开启 SOA Route` },
  S: { name: 'standalone', text: '已开启', description: e => `该应用在 ${e} 上已经结束灰度, 正式开启 SOA Route` },
};

export default function RouteStatus({ value, ezone, title, href, onClick }) {
  const statusInfo = RouteStatus.getStatusInfo(value);
  return (
    <a
      className={`route-status route-status--${statusInfo.name}`}
      title={`${statusInfo.description(ezone)}。${title}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
    >
      {statusInfo.text}
    </a>
  );
}

RouteStatus.propTypes = {
  value: PropTypes.oneOf(Object.keys(ROUTE_STATUS_LIST)),
  ezone: PropTypes.string,
  title: PropTypes.string,
  href: PropTypes.string,
  onClick: PropTypes.func,
};

RouteStatus.defaultProps = {
  value: undefined,
  ezone: 'E-Zone',
  title: '',
  href: '#',
  onClick: () => null,
};

RouteStatus.getStatusInfo = value => ROUTE_STATUS_LIST[value];
RouteStatus.listStatusInfo = () => ROUTE_STATUS_LIST;
