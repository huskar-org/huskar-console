import React from 'react';
import PropTypes from 'prop-types';
import Button from 'components/button';
import TextField from 'components/textfield';
import DialogConfirm from 'components/dialog/confirm';
import Table from 'components/table';
import HuskarModel from 'services/huskarmodel';
import dialog from 'services/dialog';
import comfilter from 'decorators/comfilter';
import Editor from './editor';
import cx from './index.sass';

class TeamAdmin extends React.Component {
  static propTypes = {
    params: PropTypes.shape({
      teamName: PropTypes.string.isRequired,
    }).isRequired,
  };

  componentDidMount() {
    const { teamName } = this.props.params;
    this.handleRefresh(teamName);
  }

  componentWillReceiveProps(props, nextProps) {
    const { teamName } = nextProps.params;
    this.handleRefresh(teamName);
  }

  onListChange = () => {
    this.team.getPrivilegeList().then((list) => {
      this.list = list;
      this.forceUpdate();
    });
  }

  handleRefresh = async (teamName) => {
    const team = await HuskarModel.getTeam(teamName);
    if (this.team) {
      this.team.off('privilegeListChange', this.onListChange);
    }
    this.team = team;
    team.on('privilegeListChange', this.onListChange);
    this.onListChange();
  }

  editItem = (item) => {
    const { teamName } = this.props.params;
    HuskarModel.getTeam(teamName).then((team) => {
      dialog.then(c => c.popup(<Editor team={team} data={item} />));
    });
  }

  addItem = () => {
    const { teamName } = this.props.params;
    HuskarModel.getTeam(teamName).then((team) => {
      dialog.then(c => c.popup(<Editor team={team} title="Create TeamAdmin" />));
    });
  }

  render() {
    return (
      <div className={cx.top}>
        <div className={cx.filter}>
          <TextField name="username" placeholder="user name filter" onChange={this.onFilterChange} />
          <div className={cx.buttons}>
            <Button onClick={this.addItem}>Create</Button>
          </div>
        </div>
        <div className={cx.content}>
          <Table>
            <thead>
              <tr>
                <td>User Name</td>
                <td>Actions</td>
              </tr>
            </thead>
            <tbody>
              { this.list && this.list.filter(this.filter).map(item => (
                <tr key={item.username}>
                  <td>{item.username}</td>
                  <td>
                    <Button
                      onClick={() => dialog.then(c => c.popup(<DialogConfirm
                        onYes={() => {
                          item.remove();
                          c.close();
                        }}
                        onNo={() => {
                          c.close();
                        }}
                      />))}
                      type="default"
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              )) }
            </tbody>
          </Table>
        </div>
      </div>
    );
  }
}

export default comfilter(TeamAdmin);
