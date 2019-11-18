import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Octicon from 'react-octicon';
import Button from '../../button';
import TextField from '../../textfield';
import DialogConfirm from '../../dialog/confirm';
import Table from '../../table';
import { UserLabel } from '../../inline';
import dialog from '../../../services/dialog';
import Editor from './editor';
import cx from './index.sass';
import * as actions from '../../../actions';
import * as schemas from '../../../constants/schemas';
import comfilter from '../../../decorators/comfilter';

class Privilege extends React.Component {
  static propTypes = {
    params: PropTypes.shape({
      applicationName: PropTypes.string.isRequired,
    }).isRequired,
    privileges: PropTypes.arrayOf(PropTypes.shape({
      authority: PropTypes.string,
      user: PropTypes.object,
      username: PropTypes.string,
    })).isRequired,
    isChanging: PropTypes.bool.isRequired,
    onLoad: PropTypes.func.isRequired,
    onCreate: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
  };

  componentDidMount() {
    this.props.onLoad(this.props.params.applicationName);
  }

  componentWillReceiveProps(nextProps) {
    const { applicationName } = this.props.params;
    const { applicationName: nextApplicationName } = nextProps.params;
    if (applicationName !== nextApplicationName) {
      this.props.onLoad(nextApplicationName);
    }
  }

  handleClickRefresh = () => {
    const { onLoad, params: { applicationName } } = this.props;
    onLoad(applicationName);
  }

  handleClickCreate = () => {
    const editor = (
      <Editor
        title="Create privilege entry"
        applicationName={this.props.params.applicationName}
        onSubmit={this.props.onCreate}
      />
    );
    dialog.then(c => c.popup(editor));
  }

  handleClickDelete = (username, authority) => () => {
    const confirm = (
      <DialogConfirm
        onYes={() => {
          this.props.onDelete(this.props.params.applicationName, username, authority);
          dialog.then(c => c.close());
        }}
        onNo={() => {
          dialog.then(c => c.close());
        }}
      />
    );
    dialog.then(c => c.popup(confirm));
  }

  renderItem = (item) => {
    const { applicationName } = this.props.params;
    const { authority, user } = item;
    return (
      <tr key={applicationName + user.username + authority}>
        <td>
          <UserLabel user={user} />
        </td>
        <td>{authority}</td>
        <td>
          <Button
            onClick={this.handleClickDelete(user.username, authority)}
            type="default"
          >
            Remove
          </Button>
        </td>
      </tr>
    );
  }

  render() {
    const { isChanging, privileges } = this.props;
    return (
      <div className={cx.top}>
        <div className={cx.filter}>
          <TextField name="username" placeholder="username filter" onChange={this.onFilterChange} />
          &nbsp;&nbsp;
          <TextField name="authority" placeholder="privilege filter" onChange={this.onFilterChange} />
          <div className={cx.buttons}>
            <Button onClick={this.handleClickCreate}>Create</Button>
          </div>
        </div>
        <div className={cx.content}>
          <Table loading={isChanging}>
            <thead>
              <tr>
                <td>User Name</td>
                <td>Privilege</td>
                <td>
                  <Button
                    onClick={this.handleClickRefresh}
                    title="Refresh"
                  >
                    <Octicon name="sync" />
                  </Button>
                </td>
              </tr>
            </thead>
            <tbody>
              {privileges && privileges
                .filter(item => this.filter(item)).map(this.renderItem)}
            </tbody>
          </Table>
        </div>
      </div>
    );
  }
}


function mapStateToProps(state) {
  const privileges = schemas.privilegeListSelector(state).toJS();
  const isChanging = schemas.privilegeIsChangingSelector(state);
  return { privileges, isChanging };
}

function mapDispatchToProps(dispatch) {
  return {
    onLoad(applicationName) {
      dispatch(actions.fetchPrivileges(applicationName));
    },
    onCreate(applicationName, username, authority) {
      dispatch(actions.createPrivilege(applicationName, username, authority));
    },
    onDelete(applicationName, username, authority) {
      dispatch(actions.deletePrivilege(applicationName, username, authority));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(comfilter(Privilege));
