import React from 'react';
import PropTypes from 'prop-types';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-groovy';
import './index.sass';

export default function Highlight({ value, language }) {
  const html = Prism.highlight(value, Prism.languages[language]);
  const markup = { __html: html };
  const cx = `highlight language-${language}`;
  // eslint-disable-next-line react/no-danger
  return <pre className={cx} dangerouslySetInnerHTML={markup} />;
}

Highlight.propTypes = {
  value: PropTypes.string.isRequired,
  language: PropTypes.oneOf(Object.keys(Prism.languages)),
};

Highlight.defaultProps = {
  language: 'clike',
};
