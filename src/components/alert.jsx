import React from 'react';
import PropTypes from 'prop-types';
import Octicon from 'react-octicon';
import './alert.sass';

const ALERT_ICON_MAP = {
  info: 'info',
  success: 'check',
  error: 'stop',
  warning: 'issue-opened',
};

export default class Alert extends React.Component {
  static propTypes = {
    type: PropTypes.string,
    onClose: PropTypes.func,
    children: PropTypes.element,
    allowToClose: PropTypes.bool,
  };

  static defaultProps = {
    type: 'info',
    onClose: null,
    children: null,
    allowToClose: false,
  };

  constructor(props) {
    super(props);

    this.state = {
      visible: true,
    };
  }

  handleClose = () => {
    if (!this.props.allowToClose) {
      return;
    }
    this.setState({
      visible: false,
    }, () => {
      if (this.props.onClose) {
        this.props.onClose();
      }
    });
  }

  render() {
    const { type, allowToClose } = this.props;
    const iconType = ALERT_ICON_MAP[type];

    const alertItem = this.state.visible ? (
      <div key="alert" className={`alert-content alert-content__${type}`}>
        <span className="alert-content-icon">
          <Octicon name={iconType} />
        </span>
        <span className="alert-content__description">{this.props.children}</span>
        {allowToClose && (
          <button className="alert-content__close" type="button" onClick={this.handleClose}>
            <Octicon name="x" />
          </button>
        )}
      </div>
    ) : null;
    return (
      <div className="alert">
        {alertItem}
      </div>
    );
  }
}
