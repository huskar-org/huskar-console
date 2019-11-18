import React from 'react';
import PropTypes from 'prop-types';
import { Cluster } from '../../structures';
import './zone.sass';

export default function ZoneLabel({ value, allowUndeclared }) {
  const zone = Cluster.getZone(value);
  const isZone = Boolean(zone && zone.name);
  const title = isZone ? `${zone.name} (${zone.idc})` : 'undeclared ezone';
  const cx = isZone ? 'inline-zone inline-zone--is-ezone' : 'inline-zone';
  if (!allowUndeclared && !isZone) {
    throw new Error(`Unknown ezone: "${value}"`);
  }
  return (
    <span className={cx} title={title}>
      {isZone ? zone.name : value}
    </span>
  );
}

ZoneLabel.propTypes = {
  value: PropTypes.string.isRequired,
  allowUndeclared: PropTypes.bool,
};

ZoneLabel.defaultProps = {
  allowUndeclared: false,
};
