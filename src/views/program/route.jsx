import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { locationShape } from 'react-router';
import _ from 'lodash';
import TextField from '../../components/textfield';
import Table from '../../components/table';
import { ZoneLabel, RouteStatus } from '../../components/inline';
import Button from '../../components/button';
import api from '../../services/api';
import * as actions from '../../actions';
import * as schemas from '../../constants/schemas';
import * as hrefs from '../../constants/hrefs';
import { WellKnownData } from '../../structures';
import { OVERALL_CLUSTER } from '../../constants/common';
import { ROUTE_EZONE_CLUSTERS, ROUTE_ADMIN_ONLY_EZONE } from '../../constants/env';
import './route.sass';

const FILTER_FUNCTIONS = {
  application: application => application.get('name'),
  team: application => application.getIn(['team', 'name']),
  status: (application, getStateCode) => (
    Object.values(ROUTE_EZONE_CLUSTERS)
      .map(c => getStateCode(application.get('name'), c))
  ),
};

function makeClient() {
  const internalPrefix = '_internal';
  return api[internalPrefix].arch['route-program'];
}

class RouteProgram extends React.Component {
  static propTypes = {
    location: locationShape.isRequired,
    applicationList: PropTypes.arrayOf(schemas.Application).isRequired,
    applicationLoading: PropTypes.bool.isRequired,
    onLoadApplicationList: PropTypes.func.isRequired,
    wellKnownData: PropTypes.instanceOf(WellKnownData).isRequired,
    teamGroup: PropTypes.object.isRequired, // eslint-disable-line  react/forbid-prop-types
    currentUser: PropTypes.instanceOf(schemas.UserSession),
  };

  static defaultProps = {
    currentUser: null,
  };

  state = {
    done: false,
    error: null,
    changing: false,
    data: {},
    checked: {},
    progressTotal: 0,
    progressFinished: 0,
    currentEZone: null,
    showNum: 20,
    filterValue: '',
    query: {},
  };

  componentDidMount() {
    this.handleRefresh();
    const { query } = this.props.location;
    this.setState({ query });
  }

  getClusterName = () => {
    const { currentEZone } = this.state;
    return currentEZone ? ROUTE_EZONE_CLUSTERS[currentEZone] : OVERALL_CLUSTER;
  }

  getStateCode = (applicationName, clusterName) => {
    const { wellKnownData } = this.props;
    const { data } = this.state;
    const ezone = this.getEzone(clusterName);
    const stateData = data[clusterName];
    const fallbackData = data[OVERALL_CLUSTER] || {};
    const defaultHijackMode = wellKnownData.getRouteDefaultHijackMode(ezone);
    return stateData
      ? stateData[applicationName] || defaultHijackMode
      : fallbackData[applicationName] || defaultHijackMode;
  }

  getEzones = clusterName => (
    Object.entries(ROUTE_EZONE_CLUSTERS).filter(([, c]) => c === clusterName)
      .map(([e]) => e)
  )

  getEzone = clusterName => this.getEzones(clusterName)[0]

  handleLoad = () => {
    const { showNum } = this.state;
    this.setState({ showNum: showNum + 20 });
  }

  handleRefresh = () => {
    const { applicationList, onLoadApplicationList } = this.props;
    if (applicationList.length === 0) {
      onLoadApplicationList();
    }
    this.setState({ done: false });
    Promise.all(Object.values(ROUTE_EZONE_CLUSTERS).map(clusterName => (
      makeClient().get({ cluster: clusterName }).then(({ status, data }) => {
        const newData = data.data;
        if (status < 400) {
          newData.clusterName = clusterName;
        }
        return { status, data: newData, message: data.message };
      }))))
      .then((values) => {
        const finalData = {};
        let error = false;
        values.forEach(({ status, data, message }) => {
          if (status < 400) {
            const { clusterName, route_stage: routeStage } = data;
            finalData[clusterName] = routeStage;
          } else {
            error = true;
            this.setState({ done: true, error: message, data: {} });
          }
        });
        if (!error) {
          this.setState({
            done: true,
            error: null,
            data: finalData,
          });
        }
      });
  }

  handleChangeQuery = (name, value) => (event) => {
    event.preventDefault();
    let { query } = this.state;
    query = Object.assign({}, query, { [name]: value });
    this.setState({ checked: {}, showNum: 20, filterValue: '', query });
  }

  handleChangeSearch = (event) => {
    this.setState({ checked: {}, showNum: 20, filterValue: event.target.value });
  }

  handleSubmit = (applicationName, status, clusterName) => () => {
    this.setState({ changing: true });
    makeClient().post({
      application: applicationName,
      stage: status,
      cluster: clusterName,
    }).then((response) => {
      if (response.status < 400) {
        const { data: oldData } = this.state;
        this.setState({
          changing: false,
          data: Object.assign(oldData, { [clusterName]: response.data.data.route_stage }),
        });
      } else {
        this.setState({ changing: false });
      }
    });
  }

  handleSubmitChecked = (applicationList, statusCode) => () => {
    const { checked } = this.state;
    const nameList = applicationList
      .map(item => item.get('name'))
      .filter(name => checked[name]);

    this.setState({ changing: true, progressTotal: nameList.length });
    const clusterName = this.getClusterName();
    let next = Promise.resolve();
    nameList.forEach((name, index) => {
      next = next
        .then(() => makeClient().post({
          application: name,
          stage: statusCode,
          cluster: clusterName,
        }))
        .then(() => {
          this.setState({ progressFinished: index + 1 });
        });
    });
    next.then(() => {
      this.setState({ changing: false });
      this.handleRefresh();
    });
  }

  handleCheckAll = (applicationList, isChecked) => () => {
    const checked = applicationList
      .map(item => item.get('name'))
      .reduce((prev, item) => Object.assign(prev, { [item]: isChecked }), {});
    this.setState({ checked });
  }

  handleCheckItem = application => () => {
    const name = application.get('name');
    const isChecked = !this.state.checked[name];
    this.setState(prevState => ({
      checked: Object.assign({}, prevState.checked, { [name]: isChecked }),
    }));
  }

  handleEZoneChange = (event) => {
    const currentEZone = event.target.value;
    this.setState({ currentEZone });
  }

  filterApplicationList(applicationList) {
    const { query, filterValue } = this.state;
    let result = applicationList;
    Object.keys(FILTER_FUNCTIONS).forEach((name) => {
      const value = (query[name] || '').trim();
      const filterFunction = FILTER_FUNCTIONS[name];
      if (value.length > 0) {
        result = result.filter((item) => {
          const v = filterFunction(item, this.getStateCode);
          if (Array.isArray(v)) {
            return v.includes(value);
          }
          return v === value;
        });
      }
    });

    if (filterValue !== '') {
      result = result.filter(item => item.get('name').indexOf(filterValue) >= 0);
    }

    return result;
  }

  renderStatusBadge(statusCode, ezone = 'E-Zone') {
    return (
      <RouteStatus
        value={statusCode}
        ezone={ezone}
        title="点击只查看该状态的条目。"
        href={`?status=${statusCode}`}
        onClick={this.handleChangeQuery('status', statusCode)}
      />
    );
  }

  renderStatus(application, clusterName) {
    const name = application.get('name');
    const statusCode = this.getStateCode(name, clusterName);
    const statusInfo = RouteStatus.getStatusInfo(statusCode);
    const ezones = this.getEzones(clusterName);
    return (
      <div key={`status+${name}+${clusterName}`}>
        {ezones.map(ezone => (
          <div key={`status+${name}+${clusterName}+${ezone}`} className="route-program__status-item">
            <span className="route-program__status-item-section">
              <ZoneLabel value={ezone} allowUndeclared />
            </span>
            {this.renderStatusBadge(statusCode, ezone)}
            {statusInfo.description(ezone)}
          </div>
        ))}
      </div>
    );
  }

  renderAction(application, clusterName) {
    const name = application.get('name');
    const { currentUser } = this.props;
    const statusCode = this.getStateCode(name, clusterName);
    const ezones = this.getEzones(clusterName);
    const { changing } = this.state;
    const restricted = ROUTE_ADMIN_ONLY_EZONE.some(e => ezones.includes(e));
    const disabled = changing || restricted;
    const rollbackDisable = changing || restricted || !currentUser.get('isAdmin');
    const tip = restricted
      ? `只有管理员可以修改 ${ezones.join('/')} 的 SOA Route 状态`
      : '';
    return (
      <div key={`action+${name}+${clusterName}`}>
        {ezones.map(e => (
          <div key={`action+${name}+${clusterName}+${e}`} className="route-program__action-item">
            {(statusCode === 'D' || statusCode === 'C') && (
              <Button
                onClick={this.handleSubmit(name, 'S', clusterName)}
                title={tip}
                disabled={disabled}
                effect="delay"
              >
                开启
              </Button>
            )}
            {(statusCode === 'E' || statusCode === 'S') && (
              <Button
                onClick={this.handleSubmit(name, 'C', clusterName)}
                title={tip}
                disabled={rollbackDisable}
                type="default"
                effect="delay"
              >
                回退
              </Button>
            )}
          </div>
        ))}
      </div>
    );
  }

  renderFilterLine() {
    const { query } = this.state;
    const filters = Object.keys(FILTER_FUNCTIONS)
      .map(name => ({ name, value: (query[name] || '').trim() }))
      .filter(filter => filter.value.length > 0);
    const renderStatus = value => (
      <span>{RouteStatus.getStatusInfo(value).text}</span>
    );
    return (
      <div className="route-program__filter-list">
        {filters.map(({ name, value }) => (
          <div className="route-program__filter-item" key={name}>
            <span className="route-program__filter-key">{name}</span>
            <span className="route-program__filter-value">
              {name === 'status' ? renderStatus(value) : this.renderFilterValue(name, value)}
            </span>
            <a
              className="route-program__filter-discard"
              href="#discard"
              onClick={this.handleChangeQuery(name, undefined)}
            >
              ✗
            </a>
          </div>
        ))}
      </div>
    );
  }

  renderFilterValue(name, value) {
    const { teamGroup } = this.props;
    if (name !== 'team') {
      return value;
    }
    return teamGroup[value] || value;
  }

  renderCheckBox(applicationList) {
    const { checked } = this.state;
    const isSomeChecked = applicationList.some(item => checked[item.get('name')]);
    const isEveryChecked = applicationList.every(item => checked[item.get('name')]);
    const isIndeterminate = isSomeChecked && !isEveryChecked;
    const count = Object.keys(checked).filter(name => checked[name]).length;
    return (
      <div>
        <span className="route-program__checkbox-count">选中 {count} 个</span>
        <input
          type="checkbox"
          checked={isSomeChecked}
          onChange={this.handleCheckAll(applicationList, !isSomeChecked)}
          ref={(input) => {
            if (input) {
              // eslint-disable-next-line no-param-reassign
              input.indeterminate = isIndeterminate;
            }
          }}
        />
      </div>
    );
  }

  render() {
    const { applicationLoading, currentUser } = this.props;
    const {
      done, error, changing, checked, progressTotal, progressFinished,
      currentEZone, showNum, filterValue,
    } = this.state;
    const applicationList = this.filterApplicationList(this.props.applicationList);
    const isLoading = applicationLoading || !done;
    const headLine = (
      <div className="route-program__headline">
        <h1>SOA Route Program</h1>
        <div className="route-program__headline-buttons">
          <Button onClick={this.handleRefresh} disabled={changing}>刷新</Button>
        </div>
        {currentUser && currentUser.get('isAdmin') && (
          <div className="route-program__headline-management">
            {!_.isEmpty(ROUTE_EZONE_CLUSTERS) && (
              <select
                className="route-program__headline-management-select"
                value={currentEZone}
                onChange={this.handleEZoneChange}
              >
                {Object.entries(ROUTE_EZONE_CLUSTERS)
                  .sort((a, b) => (a[1] === OVERALL_CLUSTER ? 1 : a[0] > b[0]))
                  .reverse()
                  .map(([ezone]) => (
                    <option key={ezone} value={ezone}>{ezone}</option>
                  ))}
              </select>
            )}
            {changing && progressTotal > 0
              ? `切换中: ${progressFinished} / ${progressTotal}`
              : '批量切换到'}
            {Object.keys(RouteStatus.listStatusInfo()).map(statusCode => (
              <Button
                key={statusCode}
                type="default"
                onClick={this.handleSubmitChecked(applicationList, statusCode)}
                className="route-program__headline-management-button"
              >
                {RouteStatus.getStatusInfo(statusCode).text}
              </Button>
            ))}
          </div>
        )}
        <div className="route-program__headline-intro-group">
          <div className="route-program__headline-intro">
            <span className="route-program__headline-intro-section">产研影响</span>
            {this.renderStatusBadge('D')}
            {this.renderStatusBadge('C')}
            {' 一定无影响 / '}
            {this.renderStatusBadge('E')}
            {' 预计无影响 / '}
            {this.renderStatusBadge('S')}
            {' 集群调用关系只能在路由面板修改, 见'}
            <a
              href={hrefs.ROUTE_PROGRAM_WIKI.USER_MANUAL}
              className="route-program__headline-intro-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              用户手册
            </a>
          </div>

          <div>
            <span className="route-program__headline-intro-section">过滤 Application</span>
            <TextField
              name="name"
              placeholder="application filter"
              value={filterValue}
              onChange={this.handleChangeSearch}
            />
          </div>

        </div>
      </div>
    );
    const filterLine = this.renderFilterLine();

    if (error && !isLoading) {
      return (
        <div className="route-program">
          {headLine}
          {filterLine}
          <div className="route-program__content route-program__content--error">
            {error}
          </div>
        </div>
      );
    }

    return (
      <div className="route-program">
        {headLine}
        {filterLine}
        <div className="route-program__content">
          <Table loading={isLoading}>
            <thead>
              <tr>
                <td>#</td>
                <td>Team</td>
                <td>Application</td>
                <td>Status</td>
                <td>Action</td>
                {currentUser && currentUser.get('isAdmin') && (
                  <td>{this.renderCheckBox(applicationList)}</td>
                )}
              </tr>
            </thead>
            <tbody>
              {applicationList.slice(0, showNum).map((application, key) => (
                <tr key={application.get('name')} id={`application-${application.get('name')}`}>
                  <td>
                    <a href={`#application-${application.get('name')}`}>{key + 1}</a>
                  </td>
                  <td>
                    <a
                      title="只查看该 team 下的 application"
                      href={`?team=${application.getIn(['team', 'name'])}`}
                      onClick={this.handleChangeQuery('team', application.getIn(['team', 'name']))}
                    >
                      {application.getIn(['team', 'desc']) || application.getIn(['team', 'name'])}
                    </a>
                  </td>
                  <td>
                    <a
                      title="只查看该 application"
                      href={`?application=${application.get('name')}`}
                      onClick={this.handleChangeQuery('application', application.get('name'))}
                    >
                      {application.get('name')}
                    </a>
                    <a
                      title="在新窗口打开该 application 的配置页"
                      href={`/application/${application.get('name')}/service`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="route-program__application-icon" />
                    </a>
                  </td>
                  <td>
                    {_.union(Object.values(ROUTE_EZONE_CLUSTERS))
                      .map(c => this.renderStatus(application, c))}
                  </td>
                  <td>
                    {_.union(Object.values(ROUTE_EZONE_CLUSTERS))
                      .map(c => this.renderAction(application, c))}
                  </td>
                  {currentUser && currentUser.get('isAdmin') && (
                    <td
                      role="presentation"
                      onClick={this.handleCheckItem(application)}
                    >
                      <input
                        type="checkbox"
                        checked={checked[application.get('name')] || false}
                        onChange={this.handleCheckItem(application)}
                      />
                    </td>
                  )}
                </tr>
              ))}
              {showNum < applicationList.length ? (
                <tr>
                  <td colSpan="6">
                    <Button
                      className="route-program__load"
                      onClick={this.handleLoad}
                    >
                      点击继续加载...
                    </Button>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </Table>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const applicationLoading = schemas.applicationTreeLoadingSelector(state);
  let applicationList = schemas
    .applicationListSelector(state)
    .filter(item => !item.get('isInfra') && !item.get('isDeprecated'))
    .filter(item => item.get('name').toLowerCase() === item.get('name'))
    .filter(item => item.get('name').indexOf('.') > 0);
  applicationList = _.sortBy(applicationList, item => item.getIn('team', 'name'));
  const teamGroup = _.fromPairs(applicationList.map((
    item => [item.get('team').get('name'), item.get('team').get('desc')]
  )));
  const currentUser = schemas.userSessionSelector(state);
  const wellKnownData = schemas.wellKnownDataSelector(state);
  return { applicationList, applicationLoading, currentUser, wellKnownData, teamGroup };
}

function mapDispatchToProps(dispatch) {
  return {
    onLoadApplicationList() {
      dispatch(actions.fetchApplicationList());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(RouteProgram);
