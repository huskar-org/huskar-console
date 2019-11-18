import React from 'react';
import PropTypes from 'prop-types';
import dialog from '../services/dialog';
import DialogConfirm from './dialog/confirm';
import cx from './upload.sass';

export default class Upload extends React.Component {
  static propTypes = {
    isMultiple: PropTypes.bool,
    onUpload: PropTypes.func.isRequired,
    buttonTexts: PropTypes.shape({
      ok: PropTypes.string,
      yes: PropTypes.string,
      no: PropTypes.string,
    }),
    contentFunc: PropTypes.func,
    additionalNode: PropTypes.node,
    onClick: PropTypes.func,
  };

  static defaultProps = {
    isMultiple: false,
    contentFunc: null,
    buttonTexts: {},
    additionalNode: null,
    onClick: null,
  };

  state = { value: '' };

  click = () => {
    const { onClick } = this.props;
    if (onClick) {
      onClick();
    }
    this.input.click();
  };

  handleChange = (event) => {
    this.handleUpload(event.target.files);
    this.setState({ value: '' });
  };

  handleUploadConfirm = (data) => {
    dialog.then(c => c.close());
    this.props.onUpload(data);
  };

  handleUpload = (files) => {
    if (files.length === 0) {
      return;
    }
    const file = files[0];
    const reader = new FileReader();
    const { contentFunc, buttonTexts, additionalNode } = this.props;

    reader.onload = (event) => {
      dialog.then(c => c.popup(<DialogConfirm
        content={contentFunc && contentFunc(file)}
        description={!contentFunc && `upload "${file.name}"`}
        additionalNode={additionalNode}
        buttonTexts={buttonTexts}
        onYes={() => this.handleUploadConfirm(event.target.result)}
        onNo={() => dialog.then(x => x.close())}
      />));
    };
    reader.readAsText(file);
  };

  render() {
    return (
      <input
        type="file"
        ref={(input) => { this.input = input; }}
        className={cx.hidden}
        onChange={this.handleChange}
        value={this.state.value}
        multiple={this.props.isMultiple}
      />
    );
  }
}
