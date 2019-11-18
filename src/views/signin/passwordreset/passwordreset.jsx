import React from 'react';
import PropTypes from 'prop-types';
import URL from 'url-parse';
import { routerShape, locationShape } from 'react-router';
import * as hosts from '../../../constants/hosts';
import api from '../../../services/api';
import dialog from '../../../services/dialog';
import FreeLink from '../../../components/link';
import Button from '../../../components/button';
import TextField from '../../../components/textfield';
import Box from '../box';
import '../box.sass';

export default class SignInPasswordResetBox extends React.Component {
  static propTypes = {
    router: routerShape.isRequired,
    location: locationShape.isRequired,
    username: PropTypes.string,
    token: PropTypes.string,
  };

  static defaultProps = {
    username: null,
    token: null,
  };

  state = {
    username: '',
    password: '',
    isValid: false,
    buttonMessage: '',
    resultMessage: '',
  };

  componentDidMount() {
    if (this.isTokenProvided()) {
      dialog.then(c => c.onSubmit(this.handleConfirm));
    } else {
      dialog.then(c => c.onSubmit(this.handleRequest));
    }
  }

  isTokenProvided = () => {
    if (this.props.username && this.props.token) {
      return /^[a-f0-9]{32}$/.exec(this.props.token);
    }
    return false;
  }

  handleUsernameChange = (event) => {
    const username = event.target.value;
    const isValid = Boolean(/^[a-z0-9.]+$/.exec(username));
    this.setState({ username, isValid });
  }

  handlePasswordChange = (event) => {
    const password = event.target.value;
    const isValid = password.length >= 10;
    const resultMessage = (!password || isValid) ? '' : '密码最少需要包含 10 个字符';
    this.setState({ password, isValid, resultMessage });
  }

  handleRequest = () => {
    const presentState = Object.assign({}, this.state);
    const { username } = presentState;
    this.setState({ isValid: false, buttonMessage: '请求中…' }, () => {
      api.user(username)['password-reset'].post().then((response) => {
        if (response.status < 400) {
          this.setState({
            buttonMessage: '已请求重置',
            resultMessage: '请检查邮箱，收到邮件后点击其中链接重置密码',
          });
        } else {
          this.setState(presentState);
        }
      });
    });
  }

  handleConfirm = () => {
    const presentState = Object.assign({}, this.state);
    const { username, token } = this.props;
    const { password } = this.state;
    this.setState({ isValid: false, buttonMessage: '请求中…' }, () => {
      const data = { token, password };
      api.user(username)['password-reset'].post(data).then((response) => {
        if (response.status < 400) {
          this.setState({
            buttonMessage: '重置成功',
            resultMessage: '可以试试用新密码登录了',
          });
        } else {
          this.setState(presentState);
        }
      });
    });
  }

  renderFields() {
    const { username, router } = this.props;
    const { isValid, buttonMessage } = this.state;
    const resultMessage = this.state.resultMessage ? (
      <tr>
        <td colSpan="2">{this.state.resultMessage}</td>
      </tr>
    ) : null;
    const link = hosts.DEPLOYMENT_LINKS.find(r => r.name === hosts.stageName);

    if (link && (new URL(link.href).hostname !== window.location.hostname)) {
      return (
        <tbody>
          <tr>
            <td>
              <a href={link.href + router.getCurrentLocation().pathname}>
                请前往主域名进行密码修改
                <span className="signin__notice">
                  【点击文字即可跳转】
                </span>
              </a>
            </td>
          </tr>
        </tbody>
      );
    }

    if (this.isTokenProvided()) {
      return (
        <tbody>
          <tr>
            <td>账号</td>
            <td><TextField type="text" defaultValue={username} disabled="true" /></td>
          </tr>
          <tr>
            <td>密码</td>
            <td><TextField type="password" onChange={this.handlePasswordChange} disabled={buttonMessage.length > 0} /></td>
          </tr>
          {resultMessage}
          <tr>
            <td colSpan="2" className="signin__buttonbar">
              <Button onClick={this.handleConfirm} disabled={!isValid}>
                {buttonMessage || '确认重置密码'}
              </Button>
            </td>
          </tr>
        </tbody>
      );
    }
    return (
      <tbody>
        <tr>
          <td>账号</td>
          <td>
            <TextField type="text" onChange={this.handleUsernameChange} disabled={buttonMessage.length > 0} />
          </td>
        </tr>
        {resultMessage}
        <tr>
          <td colSpan="2" className="signin__buttonbar">
            <Button onClick={this.handleRequest} disabled={!isValid}>
              {buttonMessage || '发送身份验证邮件'}
            </Button>
          </td>
        </tr>
      </tbody>
    );
  }

  render() {
    const { router, location } = this.props;
    return (
      <Box router={router} title="自助重置密码">
        <table>
          {this.renderFields()}
        </table>
        <div className="signin__linkbar">
          <FreeLink to="/signin" router={router} location={location}>
            返回登录页
          </FreeLink>
        </div>
      </Box>
    );
  }
}
