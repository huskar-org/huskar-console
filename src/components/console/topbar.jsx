import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import Button from 'components/button';
import ReplicationEditor from 'components/console/replication/editor';
import api from 'services/api';
import dialog from 'services/dialog';
import pickErrorMessage from '../../services/api/utils';
import toast from '../../services/toast';
import * as schemas from '../../constants/schemas';
import './topbar.sass';

const getApplicationMenu = name => [
  { label: 'Service', path: `/application/${name}/service` },
  { label: 'Switch', path: `/application/${name}/switch` },
  { label: 'Config', path: `/application/${name}/config` },
  { label: 'Privilege', path: `/application/${name}/privilege` },
  { label: 'Audit Log', path: `/application/${name}/audit` },
  {
    label: 'Downstream',
    path: `/application/${name}/infra-downstream`,
    when: application => application && application.get('isInfra'),
  },
];

const getTeamMenu = name => [
  { label: 'Team Admin', path: `/team/${name}/teamadmin` },
  { label: 'Application List', path: `/team/${name}/applist` },
  { label: 'Audit Log', path: `/team/${name}/audit` },
];

class TopBar extends React.Component {
  static propTypes = {
    params: PropTypes.shape({
      applicationName: PropTypes.string,
      teamName: PropTypes.string,
    }).isRequired,
    currentUser: PropTypes.instanceOf(schemas.UserSession),
    application: PropTypes.instanceOf(schemas.Application),
    team: PropTypes.instanceOf(schemas.Team),
  };

  static defaultProps = {
    currentUser: null,
    application: null,
    team: null,
  };

  getItems = () => {
    const { applicationName, teamName } = this.props.params;
    const { application, team } = this.props;
    let menu = [];

    if (applicationName) {
      menu = getApplicationMenu(applicationName)
        .filter(item => !item.when || item.when(application));
    } else if (teamName) {
      menu = getTeamMenu(teamName)
        .filter(item => !item.when || item.when(team));
    }

    return menu.map(item => (
      <li key={item.path}>
        <Link to={item.path} activeClassName="active">{item.label}</Link>
      </li>
    ));
  }

  getButtons = () => {
    const { currentUser } = this.props;
    const { applicationName } = this.props.params;
    const result = [];
    if (applicationName) {
      if (currentUser && currentUser.get('isAdmin')) {
        result.push(
          <Button key="editReplication" onClick={this.showReplicationEditor}>Replication</Button>,
        );
      }
      result.push(
        <Button key="getToken" onClick={this.showToken}>Get Token</Button>,
      );
    }
    return result;
  }

  showToken = async () => {
    const { applicationName } = this.props.params;
    const response = await api.application(applicationName).token.get();
    if (response.status < 400) {
      const { data: { token } } = response.data;
      dialog.then(c => c.popup(
        <div className="topbar__token-dialog">
          <p>
            请优先选择通过环境变量 <code>HUSKAR_API_TOKEN</code> 获取接入
            Huskar API 的 Token。
          </p>
          <hr />
          <code className="token">{token}</code>
        </div>,
      ));
    } else {
      const message = pickErrorMessage(response);
      toast(<span>{message}</span>);
    }
  }

  showReplicationEditor = async () => {
    const { applicationName } = this.props.params;
    dialog.then(c => c.popup(
      <ReplicationEditor applicationName={applicationName} />,
    ));
  }

  render() {
    return (
      <div className="topbar">
        <ul className="topbar__items">
          { this.getItems() }
        </ul>
        <div className="topbar__buttons">
          { this.getButtons() }
        </div>
      </div>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { applicationName, teamName } = ownProps.params || {};
  const applicationSelector = schemas.applicationItemSelector(applicationName);
  const teamSelector = schemas.teamItemSelector(teamName);
  const currentUser = schemas.userSessionSelector(state);
  const application = applicationSelector(state);
  const team = teamSelector(state);
  return { currentUser, application, team };
}

function mapDispatchToProps() {
  return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(TopBar);
