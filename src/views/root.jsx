import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { routerShape } from 'react-router';
import * as actions from '../actions';
import * as schemas from '../constants/schemas';
import './root.sass';

class Root extends React.Component {
  static propTypes = {
    router: routerShape.isRequired,
    children: PropTypes.node,
    currentUser: PropTypes.instanceOf(schemas.UserSession),
    currentUserState: PropTypes.oneOf(['idle', 'loading', 'success', 'error']),
    onFetchCurrentUser: PropTypes.func.isRequired,
    wellKnownState: PropTypes.oneOf(['idle', 'loading', 'success', 'error']),
    onFetchWellKnownData: PropTypes.func.isRequired,
  };

  static defaultProps = {
    currentUser: null,
    currentUserState: 'idle',
    wellKnownState: 'idle',
    children: null,
  };

  componentDidMount() {
    const { onFetchCurrentUser, currentUserState,
      wellKnownState, onFetchWellKnownData } = this.props;
    if (currentUserState === 'idle') {
      onFetchCurrentUser();
    }
    if (wellKnownState === 'idle') {
      onFetchWellKnownData();
    }
  }

  componentDidUpdate() {
    if (this.shouldRedirectToLogin()) {
      const { router } = this.props;
      const { pathname } = router.getCurrentLocation();
      router.push(`/signin?next=${encodeURI(pathname)}`);
    }
  }

  handleRefresh = target => () => {
    const { onFetchCurrentUser, onFetchWellKnownData } = this.props;
    if (target === 'user') {
      onFetchCurrentUser();
    } else if (target === 'wellKnown') {
      onFetchWellKnownData();
    }
  }

  shouldRedirectToLogin() {
    const { currentUser, currentUserState, router } = this.props;
    const { pathname } = router.getCurrentLocation();
    return (
      currentUserState === 'success'
      && currentUser.get('isAnonymous')
      && !pathname.startsWith('/signin')
      && !pathname.startsWith('/password-reset')
    );
  }

  renderState(children) {
    const { currentUserState, wellKnownState } = this.props;
    switch (currentUserState) {
      case 'idle':
      case 'loading':
        return (
          <div className="view-root__indicator view-root__indicator--loading">
            <i className="view-root__indicator-icon view-root__indicator-icon--loading" />
            <span className="view-root__indicator-text view-root__indicator-text--loading">正在检查登录状态</span>
          </div>
        );
      case 'error':
        return (
          <div className="view-root__indicator view-root__indicator--error" role="presentation" onClick={this.handleRefresh('user')}>
            <i className="view-root_indicator-icon view-root__indicator-icon--error" />
            <span className="view-root__indicator-text view-root__indicator-text--error">登录失败, 点击重试</span>
          </div>
        );
      default:
        if (this.shouldRedirectToLogin()) {
          return (
            <div className="view-root__indicator view-root__indicator--loading">
              <i className="view-root__indicator-icon view-root__indicator-icon--loading" />
              <span className="view-root__indicator-text view-root__indicator-text--loading">登录成功, 跳转中</span>
            </div>
          );
        }
    }
    switch (wellKnownState) {
      case 'idle':
      case 'loading':
        return (
          <div className="view-root__indicator view-root__indicator--loading">
            <i className="view-root__indicator-icon view-root__indicator-icon--loading" />
            <span className="view-root__indicator-text view-root__indicator-text--loading">正在获取基础数据</span>
          </div>
        );
      case 'error':
        return (
          <div className="view-root__indicator view-root__indicator--error" role="presentation" onClick={this.handleRefresh('wellKnown')}>
            <i className="view-root_indicator-icon view-root__indicator-icon--error" />
            <span className="view-root__indicator-text view-root__indicator-text--error">获取基础数据失败, 点击重试</span>
          </div>
        );
      default:
    }
    return children;
  }

  render() {
    const { children } = this.props;
    return (
      <div className="view-root">
        {this.renderState(children)}
      </div>
    );
  }
}

function mapStateToProps(state) {
  const currentUser = schemas.userSessionSelector(state);
  const currentUserState = schemas.userSessionStateSelector(state);
  const wellKnownState = schemas.wellKnownStateSelector(state);
  return { currentUser, currentUserState, wellKnownState };
}

function mapDispatchToProps(dispatch) {
  return {
    onFetchCurrentUser() {
      dispatch(actions.fetchUserSession());
    },
    onFetchWellKnownData() {
      dispatch(actions.fetchWellKnownData());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Root);
