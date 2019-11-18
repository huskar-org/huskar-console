import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { ROUTE_INTENT_LABELS } from '../../constants/ezone';
import './intent.sass';

export default function IntentLabel({ value, editable, className, onChange }) {
  const label = ROUTE_INTENT_LABELS[value] || value;

  if (editable) {
    return (
      <select
        className={`inline-intent inline-intent--editable ${className}`}
        value={value}
        onChange={onChange}
      >
        {_.toPairs(ROUTE_INTENT_LABELS).sort().map(([pValue, pLabel]) => (
          <option value={pValue} key={pValue}>{pLabel}</option>
        ))}
      </select>
    );
  }

  return (
    <span className={`inline-intent ${className}`}>
      <i className={`inline-intent__icon inline-intent__icon--${value}`} />
      <span className="inline-intent__label">{label}</span>
    </span>
  );
}

IntentLabel.propTypes = {
  value: PropTypes.oneOf(Object.keys(ROUTE_INTENT_LABELS)),
  editable: PropTypes.bool,
  className: PropTypes.string,
  onChange: PropTypes.func,
};

IntentLabel.defaultProps = {
  value: 'direct',
  editable: false,
  className: '',
  onChange: null,
};
