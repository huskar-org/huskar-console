import React from 'react';
import PropTypes from 'prop-types';
import { InfraConfigTypes } from '../../structures/infra-config';
import './infra-type.sass';

export default function InfraTypeLabel({ value, protocol, iconOnly }) {
  const infraType = InfraConfigTypes.findByKey(value) || InfraConfigTypes.findByShortName(value);
  const infraProtocol = InfraConfigTypes.findProtocol(value, protocol);
  const iconProtocolClassName = InfraConfigTypes.findTypeIconClassName(protocol);
  const iconClassName = iconProtocolClassName || InfraConfigTypes.findTypeIconClassName(value);
  const iconLabel = iconProtocolClassName ? infraProtocol.label : infraType.label;
  return (
    <span className="inline-infra-type">
      <i className={`inline-infra-type__icon ${iconClassName}`} />
      {!iconOnly && (
        <span className="inline-infra-type__label">{iconLabel}</span>
      )}
    </span>
  );
}

InfraTypeLabel.propTypes = {
  value: PropTypes.oneOf(([]
    .concat(Object.keys(InfraConfigTypes.types))
    .concat(Object.keys(InfraConfigTypes.shortNameToTypes))
  )).isRequired,
  protocol: PropTypes.string,
  iconOnly: PropTypes.bool,
};

InfraTypeLabel.defaultProps = {
  protocol: '',
  iconOnly: false,
};
