import React from 'react';
import PropTypes from 'prop-types';
import Button from 'components/button';
import cx from './percenter.sass';

export default class Percenter extends React.Component {
  static propTypes = {
    min: PropTypes.number,
    max: PropTypes.number,
    defaultValue: PropTypes.number,
    onChange: PropTypes.func,
    name: PropTypes.string,
  };

  static defaultProps = {
    min: 0,
    max: 100,
    defaultValue: 0,
    onChange: null,
    name: '',
  };

  state = { value: null };

  get value() {
    if (this.state.value === null) {
      return this.props.defaultValue;
    }
    return this.state.value;
  }

  handleClickMin = () => {
    const value = this.props.min;
    this.setState({ value });
    if (this.props.onChange) {
      this.props.onChange({ target: { name: this.props.name, value } });
    }
  }

  handleClickMax = () => {
    const value = this.props.max;
    this.setState({ value });
    if (this.props.onChange) {
      this.props.onChange({ target: { name: this.props.name, value } });
    }
  }

  handleChange = (event) => {
    const { value } = event.target;

    this.setState({ value });
    if (this.props.onChange) {
      this.props.onChange(event);
    }
  }

  render() {
    const { defaultValue, name } = this.props;
    const value = this.state.value === null ? defaultValue : this.state.value;
    return (
      <span className={cx.percenter}>
        <Button onClick={this.handleClickMin} style={{ backgroundColor: '#39f' }}>off</Button>
        <input {...this.props} name={name} onChange={this.handleChange} type="range" value={value} />
        <Button onClick={this.handleClickMax} style={{ backgroundColor: '#e66' }}>on</Button>
        <input {...this.props} name={name} onChange={this.handleChange} type="number" value={value} />
      </span>
    );
  }
}
