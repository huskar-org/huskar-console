import React from 'react';
import PropTypes from 'prop-types';
import { routerShape, locationShape } from 'react-router';
import { connect } from 'react-redux';
import Button from '../../components/button';
import TextField from '../../components/textfield';
import FreeLink from '../../components/link';
import * as actions from '../../actions';
import * as schemas from '../../constants/schemas';
import { PERMISSION_APPLY_URL } from '../../constants/hrefs';
import { FEATURE_LIST } from '../../constants/env';
import dialog from '../../services/dialog';
import Box from './box';
import './box.sass';

class SignInBox extends React.Component {
  static propTypes = {
    router: routerShape.isRequired,
    location: locationShape.isRequired,
    onSignIn: PropTypes.func.isRequired,
    signInState: PropTypes.oneOf([
      'idle', 'loading', 'success', 'error']).isRequired,
  };

  state = {
    username: '',
    password: '',
  };

  componentDidMount() {
    dialog.then((c) => {
      c.onSubmit(this.handleSignIn);
    });
  }

  handleInput = name => (event) => {
    this.setState({ [name]: event.target.value.trim() });
  }

  handleSignIn = () => {
    const { router, location, onSignIn } = this.props;
    const { username, password } = this.state;
    const { query, pathname } = location;
    const next = query.next && decodeURI(query.next);
    onSignIn(username, password).then(() => {
      dialog.then((c) => {
        c.unlock();
        c.close();
      });
      if (query.next && !next.startsWith(pathname)) {
        router.push(next);
      } else {
        router.push('/');
      }
    });
  }

  render() {
    const { router, location, signInState } = this.props;
    const { username, password } = this.state;
    const isLoading = signInState === 'loading';
    return (
      <Box router={router} title="登录">
        <table>
          <tbody>
            <tr>
              <td>账号</td>
              <td>
                <TextField
                  type="text"
                  value={username}
                  disabled={isLoading}
                  onChange={this.handleInput('username')}
                />
              </td>
            </tr>
            <tr>
              <td>密码</td>
              <td>
                <TextField
                  type="password"
                  value={password}
                  disabled={isLoading}
                  onChange={this.handleInput('password')}
                />
              </td>
            </tr>
            <tr>
              <td colSpan="2" className="signin__buttonbar">
                <Button onClick={this.handleSignIn} disabled={isLoading}>
                  {isLoading ? '正在登录…' : '登录'}
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="signin__linkbar">
          <FreeLink to="/password-reset" router={router} location={location}>
            我忘记了密码
          </FreeLink>
          {FEATURE_LIST.signup && (
            <a
              href={PERMISSION_APPLY_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              我还没有账号
            </a>
          )}
        </div>
      </Box>
    );
  }
}

function mapStateToProps(state) {
  const signInState = schemas.userSignInStateSelector(state);
  return { signInState };
}

function mapDispatchToProps(dispatch) {
  return {
    onSignIn(username, password) {
      return dispatch(actions.signIn(username, password));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SignInBox);
