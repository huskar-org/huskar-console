import React from 'react';
import PropTypes from 'prop-types';
import { routerShape } from 'react-router';
import Button from '../../components/button';
import TextField from '../../components/textfield';
import ApplicationTree from '../../components/applicationtree';
import Table from '../../components/table';
import Header from '../../components/header';
import DialogConfirm from '../../components/dialog/confirm';
import HuskarModel from '../../services/huskarmodel';
import dialog from '../../services/dialog';
import comfilter from '../../decorators/comfilter';
import { FEATURE_LIST } from '../../constants/env';
import * as hrefs from '../../constants/hrefs';
import Editor from './editor';
import './index.sass';

class User extends React.Component {
  static propTypes = {
    params: PropTypes.objectOf(PropTypes.string).isRequired,
    router: routerShape.isRequired,
  };

  componentWillMount() {
    HuskarModel.on('change', this.onChange);
    HuskarModel.on('userListChange', this.onUserListChange);
  }

  componentDidMount() {
    this.onUserListChange();
  }

  componentWillUnmount() {
    HuskarModel.off('change', this.onChange);
    HuskarModel.off('userListChange', this.onUserListChange);
  }

  onChange = () => {
    this.forceUpdate();
  }

  onUserListChange = async () => {
    this.list = await HuskarModel.getUserList();
    this.forceUpdate();
  }

  handleCreate = async () => {
    if (FEATURE_LIST.createapp) {
      (await dialog).popup(<Editor title="Create" />);
    } else {
      window.open(hrefs.PERMISSION_APPLY_URL).opener = null;
    }
  }

  removeItem = async (item) => {
    (await dialog).close();
    await item.remove();
  }

  render() {
    return (
      <div className="view-user">
        <Header />
        <div className="view-user__header">
          <ApplicationTree params={this.props.params} router={this.props.router} />
          <div className="view-user__filter">
            <div className="view-user__filterbox">
              <div>
                <TextField name="username" placeholder="username filter" onChange={this.onFilterChange} />
                &nbsp;&nbsp;
                <TextField name="email" placeholder="email filter" onChange={this.onFilterChange} />
              </div>
              <div className="view-user__buttons">
                <Button onClick={this.handleCreate}>Create</Button>
              </div>
            </div>
            <div className="view-user__content">
              <Table>
                <thead>
                  <tr>
                    <td>User Name</td>
                    <td>E-Mail</td>
                    <td>Creation Time</td>
                    <td>Admin</td>
                    <td>Actions</td>
                  </tr>
                </thead>
                <tbody>
                  {this.list && this.list.filter(this.filter).map(item => (
                    <tr key={item.username + item.email}>
                      <td>{item.username}</td>
                      <td>{item.email}</td>
                      <td title={item.created_at}>{item.creationDate}</td>
                      <td className="view-user__field-action">
                        <Button
                          style={{ backgroundColor: item.huskar_admin ? '#900' : '#ccc' }}
                          onClick={() => item.toggleHuskarAdmin()}
                        >
                          {String(item.huskar_admin)}
                        </Button>
                      </td>
                      <td className="view-user__field-action">
                        <Button
                          onClick={() => dialog.then(c => c.popup(
                            <DialogConfirm
                              onYes={() => this.removeItem(item)}
                              onNo={c.close}
                            />,
                          ))
                          }
                          type="default"
                        >Remove
                        </Button>
                      </td>
                    </tr>))}
                </tbody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default comfilter(User);
