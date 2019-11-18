import React from 'react';
import cx from './container.sass';

export default class Container extends React.Component {
  constructor() {
    super();
    this.state = { className: '', contents: null, onSubmit: null };
    this.isLocked = false;
  }

  onSubmit = (onSubmit) => {
    this.setState({ onSubmit });
  }

  handleKeyDown = (event) => {
    if (event.target.tagName === 'TEXTAREA') return;
    if (event.keyCode === 13 && this.state.onSubmit) {
      this.state.onSubmit(event);
    }
  }

  popup = (contents, onSubmit) => {
    if (this.isLocked) return;
    this.setState({ className: 'popuped', contents, onSubmit });
  }

  close = () => {
    if (this.isLocked) return;
    this.setState({ className: '', contents: null, onSubmit: null });
  }

  lock = () => {
    this.isLocked = true;
  }

  unlock = () => {
    this.isLocked = false;
  }

  render() {
    const wrapperProps = {
      className: `${cx.container} ${this.state.className}`,
      onClick: this.close,
      onKeyDown: this.handleKeyDown,
    };
    const contentProps = {
      onClick: event => event.stopPropagation(),
    };
    return (
      <div {...wrapperProps}>
        <div {...contentProps}>{this.state.contents}</div>
      </div>
    );
  }
}
