import React from 'react';
import PropTypes from 'prop-types';
import cx from './textarea.sass';

export default class TextArea extends React.Component {
  static propTypes = {
    defaultValue: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    value: PropTypes.string,
    children: PropTypes.node,
    onChange: PropTypes.func,
  };

  static defaultProps = {
    defaultValue: null,
    value: null,
    children: null,
    onChange: null,
  }

  constructor(props) {
    super(props);
    const value = props.defaultValue && props.value !== null
      ? props.defaultValue.toString() : undefined;
    this.state = { value };
  }

  get value() {
    return this.state.value;
  }

  handleChange = (event) => {
    if (this.props.value === null) {
      const { value } = event.target;
      this.setState({ value });
    }
    if (this.props.onChange) this.props.onChange(event);
  }

  render() {
    const value = this.props.value === null
      ? this.state.value : this.props.value;
    const props = Object.assign({}, this.props);
    delete props.id;
    delete props.ref;
    delete props.children;
    return (
      <span className={cx.textarea}>
        { this.props.children }
        <textarea
          {...props}
          value={value}
          onChange={this.handleChange}
        />
      </span>
    );
  }
}
