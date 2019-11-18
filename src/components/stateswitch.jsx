import React from 'react';
import PropTypes from 'prop-types';
import './stateswitch.sass';

export default class StateSwitch extends React.Component {
  static propTypes = {
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.bool,
    ]),
    onChange: PropTypes.func,
    disabled: PropTypes.bool,
    onValue: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.bool,
    ]),
    offValue: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.bool,
    ]),
    onText: PropTypes.string,
    offText: PropTypes.string,
  };

  static defaultProps = {
    onChange: null,
    disabled: false,
    onValue: true,
    offValue: false,
    offText: null,
    onText: null,
    value: null,
  };

  isOn = () => {
    const { value, onValue } = this.props;
    return value === onValue;
  }

  handleClick = () => {
    const { onChange, onValue, offValue } = this.props;
    const toggledValue = this.isOn() ? offValue : onValue;
    if (onChange) {
      onChange({ target: { value: toggledValue } });
    }
  }

  render() {
    const { disabled, onText, offText, onValue, offValue } = this.props;
    const state = this.isOn() ? 'on' : 'off';
    const stateClassName = `stateswitch-state-${state}`;
    const text = this.isOn() ? (onText || onValue.toString()) : (offText || offValue.toString());

    return (
      <button
        onClick={this.handleClick}
        className="stateswitch"
        disabled={disabled}
        type="button"
      >
        <span data-value={text} className={stateClassName} />
      </button>
    );
  }
}
