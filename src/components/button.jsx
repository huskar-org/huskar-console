import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { FEATURE_LIST } from '../constants/env';
import toast from '../services/toast';
import './button.sass';

class Button extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
    type: PropTypes.string,
    effect: PropTypes.string,
    isSummitHour: PropTypes.bool,
    delayTime: PropTypes.number,
    showTipTime: PropTypes.number,
    onClick: PropTypes.func,
    tip: PropTypes.string,
    title: PropTypes.string,
  };

  static defaultProps = {
    className: '',
    children: null,
    type: 'primary',
    effect: 'default',
    delayTime: 3000,
    showTipTime: 500,
    isSummitHour: true,
    onClick: null,
    tip: '',
    title: '',
  };

  state = {
    loading: false,
    loadingPercent: 0,
    pressAt: 0,
    timeoutID: 0,
  };

  handleLoading = (e) => {
    const { loadingPercent, loading } = this.state;
    const { onClick, delayTime } = this.props;
    if (!loading) { return; }
    if (loadingPercent > 100) {
      if (onClick) {
        onClick(e);
      }
      this.handleCancelLoading();
    } else {
      this.setState({
        loadingPercent: loadingPercent + 1,
        timeoutID: setTimeout(() => this.handleLoading(e), delayTime / 100),
      });
    }
  };

  handleCancelLoading = () => {
    clearTimeout(this.state.timeoutID);
    this.setState({
      loading: false,
      loadingPercent: 0,
      pressAt: 0,
      timeoutID: 0,
    });
  };

  handleMouseDown = (e) => {
    e.preventDefault();
    if (!this.props.onClick) { return; }
    this.setState({ loading: true, pressAt: +new Date() }, () => this.handleLoading(e));
  };

  handleMouseLeave = (e) => {
    e.preventDefault();
    if (
      this.state.pressAt !== 0
      && (+new Date() - this.state.pressAt) < this.props.showTipTime
    ) {
      toast(this.props.tip || '长按触发');
    }
    this.handleCancelLoading();
  };

  render() {
    const { effect } = this.props;
    const props = Object.assign({}, this.props, {
      className: `${this.props.className} btn btn--${this.props.type}`,
    });

    if (effect === 'delay') {
      const { loadingPercent } = this.state;
      const progressStyle = {
        width: `${loadingPercent}%`,
      };
      if (FEATURE_LIST.delaybutton) {
        Object.assign(props, {
          onClick: null,
          delayTime: this.props.isSummitHour ? 3000 : 1500,
          onMouseDown: this.handleMouseDown,
          onMouseUp: this.handleMouseLeave,
          onMouseLeave: this.handleMouseLeave,
          className: `${props.className} btn--delay`,
          title: this.props.title || this.props.tip || '长按触发',
        });
        return (
          <button {...props} type="button">
            <span>
              <span
                className={`btn--delay__progress btn--delay__progress--${this.props.type}`}
                style={progressStyle}
              />
            </span>
            <span className="btn--delay__content">
              {this.props.children}
            </span>
          </button>
        );
      }
    }

    return (
      <button {...props} type="button">{this.props.children}</button>
    );
  }
}

function mapStateToProps(state) {
  const { alarm } = state;
  const isSummitHour = alarm.get('isSummitHour');
  return { isSummitHour };
}
export default connect(mapStateToProps)(Button);
