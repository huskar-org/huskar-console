import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import XCeptor from 'xceptor';
import Button from '../../components/button';
import TextField from '../../components/textfield';
import dialog from '../../services/dialog';
import api from '../../services/api';
import * as actions from '../../actions';
import * as schemas from '../../constants/schemas';
import './changepassword.sass';

XCeptor.put(new RegExp('^/api/user/admin'), (req, res) => {
  if (!req.data) return undefined;
  const originalData = Object(req.data.originalData);
  const newPassword = originalData.new_password;
  const confirmPassword = originalData.confirm_password;
  if (newPassword !== confirmPassword) {
    // eslint-disable-next-line no-param-reassign
    res.status = 400;
    // eslint-disable-next-line no-param-reassign
    res.responseText = JSON.stringify({ message: 'Entered passwords differ' });
    return false;
  }
  return undefined;
});

class ChangePassword extends React.Component {
  static propTypes = {
    data: PropTypes.shape({
      cluster: PropTypes.string,
      key: PropTypes.string,
    }),
    title: PropTypes.string,
    currentUser: PropTypes.instanceOf(schemas.UserSession),
    onSignOut: PropTypes.func.isRequired,
  };

  static defaultProps = {
    data: { value: '100' },
    title: 'Edit',
    currentUser: null,
  };

  constructor() {
    super();
    this.state = {};
    this.fields = {};
  }

  componentDidMount() {
    dialog.then(c => c.onSubmit(this.save));
  }

  getFormData = () => {
    const data = {};
    Object.keys(this.fields).forEach((i) => {
      data[i] = this.fields[i].state.value || '';
    });
    return data;
  }

  save = async () => {
    const { currentUser, onSignOut } = this.props;
    if (currentUser && !currentUser.get('isAnonymous')) {
      const form = this.getFormData();
      const response = await api.user(currentUser.get('username')).put(form);
      if (response.status < 400) {
        dialog.then(c => c.close());
        onSignOut();
      } else {
        // TODO
      }
    }
  }

  render() {
    const { cluster, key } = this.props.data;
    return (
      <dl key={cluster + key} className="dialog-profile-editor">
        <dt>{ this.props.title }</dt>
        <dd>
          <table>
            <tbody>
              <tr>
                <td>Old Password: </td>
                <td>
                  <TextField ref={(c) => { this.fields.old_password = c; }} type="password" />
                </td>
              </tr>
              <tr>
                <td>New Password: </td>
                <td>
                  <TextField ref={(c) => { this.fields.new_password = c; }} type="password" />
                </td>
              </tr>
              <tr>
                <td>Confirm new password: </td>
                <td>
                  <TextField ref={(c) => { this.fields.confirm_password = c; }} type="password" />
                </td>
              </tr>
              <tr>
                <td />
                <td>
                  <Button onClick={this.save}>Save</Button>
                  &nbsp;&nbsp;
                  <Button type="default" onClick={() => { dialog.then(c => c.close()); }}>
                    Cancel
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </dd>
      </dl>
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

export default connect(mapStateToProps, mapDispatchToProps)(ChangePassword);
