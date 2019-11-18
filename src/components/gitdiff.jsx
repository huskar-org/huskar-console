import React from 'react';
import PropTypes from 'prop-types';
import * as jsdiff from 'diff';
import { Diff2Html } from 'diff2html';
import 'diff2html/dist/diff2html.css';
import './gitdiff.sass';

export default class GitDiff extends React.Component {
  static propTypes = {
    oldStr: PropTypes.string.isRequired,
    newStr: PropTypes.string.isRequired,
    fileName: PropTypes.string,
    className: PropTypes.string,
  };

  static defaultProps = {
    className: '',
    fileName: 'a.txt',
  };

  createDiffHtml = () => {
    const { fileName, oldStr, newStr } = this.props;
    const diffStr = jsdiff.createPatch(fileName, oldStr, newStr);
    const html = Diff2Html.getPrettyHtml(diffStr, {
      inputFormat: 'diff',
      matching: 'lines',
    });
    return { __html: html };
  };

  render() {
    const { className } = this.props;

    return (
      <div className={`git-diff ${className}`}>
        <div dangerouslySetInnerHTML={this.createDiffHtml()} />
      </div>
    );
  }
}
