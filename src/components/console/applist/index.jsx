import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import DialogConfirm from '../../dialog/confirm';
import Button from '../../button';
import Table from '../../table';
import TextField from '../../textfield';
import dialog from '../../../services/dialog';
import comfilter from '../../../decorators/comfilter';
import * as actions from '../../../actions';
import * as schemas from '../../../constants/schemas';
import * as text from '../../../constants/text';
import { FEATURE_LIST } from '../../../constants/env';
import Editor from './editor';
import cx from './index.sass';

class AppList extends React.Component {
  static propTypes = {
    params: PropTypes.shape({
      teamName: PropTypes.string.isRequired,
    }).isRequired,
    applicationTree: PropTypes.objectOf(PropTypes.arrayOf(schemas.Application)).isRequired,
    teamList: PropTypes.arrayOf(schemas.Team).isRequired,
    isFetching: PropTypes.bool.isRequired,
    isChanging: PropTypes.bool.isRequired,
    onLoad: PropTypes.func.isRequired,
    onCreateApplication: PropTypes.func.isRequired,
    onDeleteApplication: PropTypes.func.isRequired,
  };

  componentDidMount() {
    if (this.props.teamList.length === 0) {
      this.props.onLoad();
    }
  }

  handleShowCreatingDialog = (event) => {
    if ((event.altKey && event.shiftKey) || FEATURE_LIST.createapp) {
      const currentTeam = this.props.teamList
        .find(team => team.get('name') === this.props.params.teamName);
      dialog.then(c => c.popup(<Editor
        team={currentTeam}
        onSubmit={this.handleCreateApplication}
        onCancel={this.handleCancelDialog}
      />));
    } else {
      dialog.then(c => c.popup(<DialogConfirm
        canChoose={false}
        content={text.CREATE_APPLICATION_GUIDE}
        onYes={this.handleCancelDialog}
      />));
    }
  }

  handleShowDeletingDialog = application => () => {
    dialog.then(c => c.popup(<DialogConfirm
      onYes={this.handleDeleteApplication(application.get('name'))}
      onNo={this.handleCancelDialog}
    />));
  }

  handleCancelDialog = () => {
    dialog.then((c) => {
      c.close();
    });
  }

  handleCreateApplication = (applicationName) => {
    this.props.onCreateApplication(applicationName, this.props.params.teamName);
    this.handleCancelDialog();
  }

  handleDeleteApplication = applicationName => () => {
    this.props.onDeleteApplication(applicationName);
    this.handleCancelDialog();
  }

  render() {
    const { teamName } = this.props.params;
    const { applicationTree, teamList, isFetching, isChanging } = this.props;
    const applicationList = applicationTree[teamName] || [];
    const isFound = teamList.some(team => team.get('name') === teamName);

    if (!isFetching && !isFound) {
      return (
        <div clsasName={cx.applist}>
          <div className={cx.content}>
            <Table>
              <tbody>
                <tr>
                  <td>The team <code>{teamName}</code> is not found.</td>
                  <td>
                    <Link to="/team">See all teams</Link>
                  </td>
                </tr>
              </tbody>
            </Table>
          </div>
        </div>
      );
    }

    return (
      <div className={cx.applist}>
        <div className={cx.filter}>
          <TextField name="name" placeholder="application filter" onChange={this.onFilterChange} />
          <div className={cx.buttons}>
            <Button
              onClick={this.handleShowCreatingDialog}
              disabled={isFetching || isChanging}
            >
              Create
            </Button>
          </div>
        </div>
        <div className={cx.content}>
          <Table loading={isFetching}>
            <thead>
              <tr>
                <td>Application Name</td>
                <td>Actions</td>
              </tr>
            </thead>
            <tbody>
              {applicationList.filter(this.filter).map(item => (
                <tr key={item.get('name')}>
                  <td>
                    <Link to={`/application/${item.get('name')}/service`}>
                      {item.get('name')}
                    </Link>
                  </td>
                  <td>
                    <Button
                      title="长按删除"
                      type="danger"
                      effect="delay"
                      onClick={this.handleShowDeletingDialog(item)}
                      disabled={isFetching || isChanging}
                    >
                      Delete
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

function mapStateToProps(state) {
  const applicationTree = schemas.applicationTreeSelector(state);
  const teamList = schemas.teamListSelector(state);
  const isFetching = schemas.applicationTreeLoadingSelector(state);
  const isChanging = schemas.applicationTreeChangingSelector(state);
  return { applicationTree, teamList, isFetching, isChanging };
}

function mapDispatchToProps(dispatch) {
  return {
    onLoad() {
      dispatch(actions.fetchTeams());
    },
    onCreateApplication(applicationName, teamName) {
      dispatch(actions.createApplication(applicationName, teamName));
    },
    onDeleteApplication(applicationName) {
      dispatch(actions.deleteApplication(applicationName));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(comfilter(AppList));
