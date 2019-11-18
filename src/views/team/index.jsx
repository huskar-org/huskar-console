import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { routerShape, Link } from 'react-router';
import Button from '../../components/button';
import TextField from '../../components/textfield';
import ApplicationTree from '../../components/applicationtree';
import Table from '../../components/table';
import Header from '../../components/header';
import DialogConfirm from '../../components/dialog/confirm';
import dialog from '../../services/dialog';
import comfilter from '../../decorators/comfilter';
import * as actions from '../../actions';
import * as schemas from '../../constants/schemas';
import Editor from './editor';
import './index.sass';

class Team extends React.Component {
  static propTypes = {
    params: PropTypes.objectOf(PropTypes.string).isRequired,
    router: routerShape.isRequired,
    isFetching: PropTypes.bool.isRequired,
    isChanging: PropTypes.bool.isRequired,
    teamList: PropTypes.arrayOf(PropTypes.instanceOf(schemas.Team)).isRequired,
    onFetchTeamList: PropTypes.func.isRequired,
    onCreateTeam: PropTypes.func.isRequired,
    onDeleteTeam: PropTypes.func.isRequired,
    // eslint-disable-next-line react/no-unused-prop-types
    onSearch: PropTypes.func,
  };

  static defaultProps = {
    onSearch: null,
  };

  componentDidMount() {
    this.props.onFetchTeamList(this.props.teamList);
  }

  handleCreateTeam = (teamName) => {
    this.props.onCreateTeam(teamName);
    this.handleCancelDialog();
  }

  handleDeleteTeam = teamName => () => {
    this.props.onDeleteTeam(teamName);
    this.handleCancelDialog();
  };

  handleShowCreatingDialog = () => {
    dialog.then(c => c.popup(<Editor
      onSubmit={this.handleCreateTeam}
      onCancel={this.handleCancelDialog}
    />));
  }

  handleShowDeletingDialog = teamName => () => {
    dialog.then(c => c.popup(<DialogConfirm
      onYes={this.handleDeleteTeam(teamName)}
      onNo={this.handleCancelDialog}
    />));
  }

  handleCancelDialog = () => {
    dialog.then((c) => {
      c.close();
    });
  }

  render() {
    const { params, router, teamList, isFetching, isChanging } = this.props;
    return (
      <div className="view-team">
        <Header />
        <div className="view-team__tree">
          <ApplicationTree params={params} router={router} />
          <div className="view-team__container">
            <div className="view-team__filter">
              <div>
                <TextField name="name" placeholder="team filter" onChange={this.onSearchChange('name|desc')} />
              </div>
              <div className="view-team__buttons">
                <Button
                  onClick={this.handleShowCreatingDialog}
                  disabled={isChanging}
                >
                  Create
                </Button>
              </div>
            </div>
            <div className="view-team__content">
              <Table loading={isFetching}>
                <thead>
                  <tr>
                    <td>Team Name</td>
                    <td>Actions</td>
                  </tr>
                </thead>
                <tbody>
                  {teamList
                    .filter(this.filter)
                    .map(team => ({ teamName: team.get('name'), teamDesc: team.get('desc') }))
                    .map(({ teamName, teamDesc }) => (
                      <tr key={teamName}>
                        <td>
                          <Link to={`/team/${teamName}/applist`}>{teamDesc || teamName}</Link>
                        </td>
                        <td>
                          <Button
                            title="长按删除"
                            type="danger"
                            effect="delay"
                            onClick={this.handleShowDeletingDialog(teamName)}
                            disabled={isChanging}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const isFetching = schemas.applicationTreeLoadingSelector(state);
  const isChanging = schemas.applicationTreeChangingSelector(state);
  const teamList = schemas.teamListSelector(state);

  return { isFetching, isChanging, teamList };
}

function mapDispatchToProps(dispatch) {
  return {
    onFetchTeamList(teamList) {
      if (teamList.length === 0) {
        dispatch(actions.fetchTeams());
      }
    },
    onCreateTeam(teamName) {
      dispatch(actions.createTeam(teamName));
    },
    onDeleteTeam(teamName) {
      dispatch(actions.deleteTeam(teamName));
    },
    onSearch(entity, key, value) {
      return key.split('|').some(k => String(_.get(entity, k)).toLowerCase().includes(value));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(comfilter(Team));
