import React from 'react';
import PropTypes from 'prop-types';
import { InfraConfigTypes } from '../../../structures';
import Highlight from '../../highlight';

const PSEUDO_CODE = (type, name) => (`
// Pseudo Code
var client = ${type}Registry.get("${name || 'YOUR_CODE_NAME'}");
`).trim();

export default function PseudoCodeHighlight({
  infraProtocol,
  infraType,
  infraName,
}) {
  const infraProtocolCodeName = InfraConfigTypes.protocols[infraType][infraProtocol].codeName;
  return (
    <div className="infra-config-editor__pseudo-code">
      <Highlight
        value={PSEUDO_CODE(infraProtocolCodeName, infraName)}
        language="javascript"
      />
    </div>
  );
}

PseudoCodeHighlight.propTypes = {
  infraName: PropTypes.string.isRequired,
  infraType: PropTypes.oneOf(Object.keys(InfraConfigTypes.types)).isRequired,
  infraProtocol: PropTypes.string.isRequired,
};
