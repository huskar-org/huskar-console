import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { routerShape, Link } from 'react-router';
import { connect } from 'react-redux';
import TextField from './textfield';
import comfilter from '../decorators/comfilter';
import * as actions from '../actions';
import * as schemas from '../constants/schemas';
import './applicationtree.sass';

const URL_PATTERN = /^\/(team|application)\/.+\/(service|switch|config|privilege|audit|infra-downstream)\/?$/;

class ApplicationTree extends React.Component {
  static propTypes = {
    router: routerShape.isRequired,
    onLoad: PropTypes.func.isRequired,
    onToggleFull: PropTypes.func.isRequired,
    isFetching: PropTypes.bool.isRequired,
    isFull: PropTypes.bool.isRequired,
    applicationTree: PropTypes.objectOf(
      PropTypes.arrayOf(schemas.Application),
    ).isRequired,
    // eslint-disable-next-line react/no-unused-prop-types
    onSearch: PropTypes.func,
  };

  static defaultProps = {
    onSearch: null,
  };

  constructor() {
    super();
    this.state = {
      routes: {},
      foldingState: '',
    };
  }

  componentWillMount() {
    this.handleURL(this.props.router);
  }

  componentDidMount() {
    this.props.onLoad();
  }

  componentWillReceiveProps(nextProps) {
    this.handleURL(nextProps.router);
  }

  handleURL = (router) => {
    const location = router.getCurrentLocation();
    const parsedPath = URL_PATTERN.exec(location.pathname);

    const defaults = { team: 'applist', application: 'service' };
    const routes = {
      team: name => `/team/${name}/${defaults.team}`,
      application: name => `/application/${name}/${defaults.application}`,
    };

    if (parsedPath) {
      const [, primary, secondary] = parsedPath;
      if (secondary) {
        if (!primary || primary === 'team') {
          defaults.team = secondary;
        } else if (primary === 'application') {
          defaults.application = secondary;
        } else {
          throw new Error('Unknown primary route name.');
        }
      }
    }
    this.setState({ routes });
  }

  handleToggleFolder = (event) => {
    event.preventDefault();
    this.setState(prevState => ({ foldingState: !prevState.foldingState }));
  }

  renderList() {
    const { routes } = this.state;
    const { applicationTree, isFull } = this.props;
    return Object.keys(applicationTree)
      .sort()
      .map((teamName) => {
        const applicationList = applicationTree[teamName]
          .filter(this.filter)
          .filter(item => isFull || !item.get('isInfra'))
          .sort();
        const teamDesc = (applicationList.length > 0 && applicationList[0].get('team').get('desc')) || teamName;
        return { teamName, teamDesc, applicationList };
      })
      .filter(item => (
        item.applicationList.length || this.filter({ name: item.teamDesc || item.teamName })
      ))
      .map(({ teamName, teamDesc, applicationList }) => (
        <li key={teamName}>
          <strong>
            <Link to={routes.team(teamName)} activeClassName="active">{teamDesc}</Link>
          </strong>
          <ul>
            {applicationList.map(item => (
              <li
                key={item.get('name')}
                className={[
                  'applicationtree__list-item',
                  item.get('isDeprecated') ? 'applicationtree__list-item--deprecated' : '',
                ].join(' ')}
              >
                <Link
                  to={routes.application(item.get('name'))}
                  activeClassName="active"
                >
                  {item.get('name')}
                </Link>
              </li>))}
          </ul>
        </li>
      ));
  }

  render() {
    const { isFetching } = this.props;
    const { foldingState } = this.state;
    return (
      <aside className={`applicationtree ${foldingState && 'applicationtree--folded'}`}>
        <a href="#toggle" onClick={this.handleToggleFolder} className="applicationtree__toggle">
          <span>|&nbsp;|&nbsp;|</span>
        </a>
        <span className="applicationtree__filter applicationtree__loading-container">
          <TextField name="name" onChange={this.onSearchChange('name|team.desc')} placeholder="app filter" />
          {isFetching && <i className="applicationtree__loading" />}
        </span>
        <span className="applicationtree__preference">
          <label htmlFor="applicationtree-toggle-full">
            <input
              type="checkbox"
              id="applicationtree-toggle-full"
              checked={this.props.isFull}
              onChange={this.props.onToggleFull}
            />
            Show infrastructure
          </label>
        </span>
        <ul className="applicationtree__list">
          {this.renderList()}
        </ul>
      </aside>
    );
  }
}

function mapStateToProps(state) {
  const isFetching = schemas.applicationTreeLoadingSelector(state);
  const applicationTree = schemas.applicationTreeSelector(state);
  const isFull = state.preference.get('isFullApplicationTree');
  return { isFetching, applicationTree, isFull };
}

function mapDispatchToProps(dispatch) {
  return {
    onLoad() {
      dispatch(actions.fetchApplicationList());
    },
    onToggleFull() {
      dispatch(actions.toggleFullApplicationTree());
    },
    onSearch(entity, key, value) {
      return key.split('|').some(k => String(_.get(entity, k)).toLowerCase().includes(value));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(
  comfilter(ApplicationTree),
);
