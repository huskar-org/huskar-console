import React from 'react';
import PropTypes from 'prop-types';
import './textfield.sass';

export default class TextField extends React.Component {
  static propTypes = {
    defaultValue: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    value: PropTypes.string,
    outerClassName: PropTypes.string,
    children: PropTypes.node,
    onChange: PropTypes.func,
  };

  static defaultProps = {
    defaultValue: null,
    value: null,
    outerClassName: '',
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
    const { children, outerClassName } = this.props;
    const props = Object.assign({ type: 'text' }, this.props, {
      value: this.props.value === null
        ? this.state.value : this.props.value,
      onChange: this.handleChange,
    });
    return (
      <span className={`textfield ${outerClassName}`}>
        {children}
        <input {...props} />
      </span>
    );
  }
}
