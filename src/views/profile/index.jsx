import React from 'react';
import PropTypes from 'prop-types';
import { routerShape } from 'react-router';
import { connect } from 'react-redux';
import Button from '../../components/button';
import ApplicationTree from '../../components/applicationtree';
import Header from '../../components/header';
import dialog from '../../services/dialog';
import * as actions from '../../actions';
import * as schemas from '../../constants/schemas';
import ChangePassword from './changepassword';
import './index.sass';

class Profile extends React.Component {
  static propTypes = {
    params: PropTypes.objectOf(PropTypes.string).isRequired,
    router: routerShape.isRequired,
    onSignOut: PropTypes.func.isRequired,
    currentUser: PropTypes.instanceOf(schemas.UserSession),
  };

  static defaultProps = {
    currentUser: null,
  };

  changePassword = () => {
    dialog.then(c => c.popup(<ChangePassword />));
  }

  signout = () => {
    const { onSignOut } = this.props;
    onSignOut();
  }

  renderCurrentUser() {
    const { currentUser } = this.props;
    if (!currentUser) {
      return <span>Loading</span>;
    }
    if (currentUser.get('isAnonymous')) {
      return <span>Anonymous</span>;
    }
    return (
      <strong>
        {currentUser.get('username')}
        {currentUser.get('isAdmin') ? ' (admin)' : ''}
      </strong>
    );
  }

  render() {
    const { router, params } = this.props;
    return (
      <div className="view-profile">
        <Header />
        <div className="view-profile__container">
          <ApplicationTree params={params} router={router} />
          <div className="view-profile__filter">
            <div className="view-profile__filterbox">
              <div>
                Current User: {this.renderCurrentUser()}
              </div>
              <div className="view-profile__buttons">
                <Button onClick={this.changePassword}>Change Password</Button>
                &nbsp;&nbsp;
                <Button onClick={this.signout} type="default">Sign out</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const currentUser = schemas.userSessionSelector(state);
  return { currentUser };
}

function mapDispatchToProps(dispatch) {
  return {
    onSignOut() {
      dispatch(actions.signOut());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Profile);
