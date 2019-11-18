import React from 'react';
import PropTypes from 'prop-types';
import SelectInside from 'react-select';
import 'react-select/dist/react-select.css';
import cx from './select.sass';

export default class Select extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    onChange: PropTypes.func,
  };

  static defaultProps = {
    className: '',
    onChange: null,
  }

  state = {
    value: '',
  }

  handleChange = (value) => {
    this.setState({ value });
    if (this.props.onChange) this.props.onChange(value);
  }

  render() {
    const className = `${this.props.className} ${cx.select}`;
    return (
      <div className={className}>
        <SelectInside
          {...this.props}
          value={this.state.value}
          onChange={this.handleChange}
        />
      </div>
    );
  }
}
