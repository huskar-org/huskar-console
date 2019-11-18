import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { ROUTE_TYPE_LABELS } from '../../constants/ezone';

export default function RouteTypeLabel({ value, editable, className, onChange }) {
  const label = ROUTE_TYPE_LABELS[value] || value;

  if (editable) {
    return (
      <select
        className={`inline-route-type inline-route-type--editable ${className}`}
        value={value}
        onChange={onChange}
      >
        {_.toPairs(ROUTE_TYPE_LABELS).map(([pValue, pLabel]) => (
          <option value={pValue} key={pValue}>{pLabel}</option>
        ))}
      </select>
    );
  }

  return (
    <span className={`inline-route-type ${className}`}>
      <i className={`inline-route-type__icon inline-route-type__icon--${value}`} />
      <span className="inline-route-type__label">{label}</span>
    </span>
  );
}

RouteTypeLabel.propTypes = {
  value: PropTypes.oneOf(Object.keys(ROUTE_TYPE_LABELS)),
  editable: PropTypes.bool,
  className: PropTypes.string,
  onChange: PropTypes.func,
};

RouteTypeLabel.defaultProps = {
  value: 'outgoing',
  editable: false,
  className: '',
  onChange: null,
};
