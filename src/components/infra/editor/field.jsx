import React from 'react';
import PropTypes from 'prop-types';

export default function EditorField({ label, children }) {
  return (
    <div className="infra-config-editor__field">
      <span className="infra-config-editor__label">{label}</span>
      <span className="infra-config-editor__input-wrapper">{children}</span>
    </div>
  );
}

EditorField.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};
