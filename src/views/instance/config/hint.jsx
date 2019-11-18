import React from 'react';
import PropTypes from 'prop-types';
import './hint.sass';

export default function ErrorHint({ content, suggestion, isHidden }) {
  return (
    <span className={`config-error-hint ${isHidden ? 'config-error-hint--hidden' : ''}`}>
      {content
        && <span className="config-error-hint__content">{content}</span>}
      {suggestion
        && <span className="config-error-hint__suggestion">{suggestion}</span>}
    </span>
  );
}

ErrorHint.propTypes = {
  content: PropTypes.string,
  suggestion: PropTypes.string,
  isHidden: PropTypes.bool,
};

ErrorHint.defaultProps = {
  content: '',
  suggestion: '',
  isHidden: true,
};
