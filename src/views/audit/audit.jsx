import React from 'react';
import PropTypes from 'prop-types';
import { routerShape } from 'react-router';
import Octicon from 'react-octicon';
import _ from 'lodash';
import moment from 'moment';
import { connect } from 'react-redux';
import { denormalize } from 'normalizr';
import { camelCase } from 'change-case';
import { UserLabel, DateTime } from '../../components/inline';
import { parseData, getIDC } from '../../components/utils';
import Alert from '../../components/console/alert';
import Table from '../../components/table';
import Button from '../../components/button';
import DatePicker from '../../components/datepicker';
import dialog from '../../services/dialog';
import DialogConfirm from '../../components/dialog/confirm';
import { ContainerId } from '../../structures';
import * as actions from '../../actions';
import * as schemas from '../../constants/schemas';
import {
  TYPE_DELETE_SERVICE,
  TYPE_UPDATE_INFRA_CONFIG,
  TYPE_DELETE_INFRA_CONFIG,
  TYPE_DELETE_ROUTE,
  TYPES_ROLLBACK_SUPPORT,
} from '../../constants/audit';
import * as types from './types';
import AuditSearch from './audit-search';
import { checkIsDesensitized, detectEncryptedData, checkIsConfigAction } from './utils';
import './audit.sass';

const instanceActionMap = {
  switch: ['UPDATE_SWITCH', 'DELETE_SWITCH'],
  config: ['UPDATE_CONFIG', 'DELETE_CONFIG'],
  service: ['UPDATE_SERVICE', 'DELETE_SERVICE'],
};

const TYPES_CAN_ROLLBACK = TYPES_ROLLBACK_SUPPORT.map(item => item.name);
const TYPES_NO_SECRET_DATA = TYPES_ROLLBACK_SUPPORT.map(item => (
  item.mayBeDesensitized ? '' : item.name));

const instanceFilter = type => keywords => (data) => {
  const [instanceName, clusterName] = keywords
    .trim().split(':', 2).filter(x => x).map(x => x.trim());
  if (instanceActionMap[type].indexOf(data.action_name) !== -1) {
    const actionData = parseData(data.action_data);
    if (actionData) {
      const keyMatched = actionData.key === instanceName;
      return clusterName ? keyMatched && (actionData.cluster_name === clusterName) : keyMatched;
    }
  }
  return false;
};

const filterMap = {
  user: (userName, exclude) => (data) => {
    if (!data.user) {
      return false;
    }
    const isEqual = data.user.username === userName;
    return exclude ^ isEqual;
  },
  actions: action => data => action.split(',').indexOf(data.action_name) !== -1,
  config: instanceFilter('config'),
  switch: instanceFilter('switch'),
  service: instanceFilter('service'),
};

const listDateRange = (beginAt, endAt) => {
  let begin = new Date(beginAt);
  const end = new Date(endAt);
  const array = [];
  while (begin <= end) {
    array.push(moment(begin).format('YYYY-MM-DD'));
    begin = new Date(begin.setDate(begin.getDate() + 1));
  }
  return array;
};

class AuditIndex extends React.Component {
  static propTypes = {
    router: routerShape.isRequired,
    onLoad: PropTypes.func.isRequired,
    onSyncAuditLogDates: PropTypes.func.isRequired,
    onClear: PropTypes.func.isRequired,
    isFetching: PropTypes.bool.isRequired,
    audits: PropTypes.arrayOf(PropTypes.shape({
      data: schemas.AuditLog,
      date: PropTypes.string,
      index: PropTypes.number,
    })),
    fetchedAll: PropTypes.bool.isRequired,
    error: PropTypes.string,
    indexType: PropTypes.oneOf(['site', 'team', 'application']),
    indexScope: PropTypes.string,
    onAuditRollback: PropTypes.func.isRequired,
    onCancelSearch: PropTypes.func.isRequired,
    canceled: PropTypes.bool,
    fetchEnd: PropTypes.bool,
  };

  static defaultProps = {
    error: '',
    indexType: 'site',
    indexScope: null,
    audits: [],
    canceled: false,
    fetchEnd: true,
  };

  constructor(props) {
    super(props);
    this.state = { page: 1 };
    this.pageSize = 20;
  }

  componentDidMount() {
    this.handleRefresh(false);
  }

  componentDidUpdate() {
    const { audits } = this.props;
    const pageHead = audits[(this.state.page - 1) * this.pageSize];
    const query = (pageHead && (
      pageHead.date === 'infinity'
        ? { start: pageHead.index.toString() }
        : { date: pageHead.date, start: pageHead.index.toString() })) || {};
    this.redirectWithQuery(query);
  }

  componentWillUnmount() {
    this.props.onClear();
  }

  parseFiltersFromURL = () => {
    const { router } = this.props;
    const location = router.getCurrentLocation();
    const { search, keywords, exclude: queryExclude } = location.query;
    const exclude = String(queryExclude) === '1';
    const filters = (
      (keywords && search in filterMap)
        ? [filterMap[search](keywords, exclude)] : []);
    return filters;
  };

  loadContent = (filters = [], page = 1) => {
    const { indexType, indexScope } = this.props;
    this.props.onLoad(indexType, indexScope, filters, page);
  };

  redirectWithQuery = (queryAttrs) => {
    const { router } = this.props;
    const location = router.getCurrentLocation();
    const query = Object.assign({}, location.query, queryAttrs);
    if (!_.isEqual(query, location.query)) {
      router.push({ ...location, query });
    }
  };

  filterAuditLogs = (data, filters) => {
    const audits = [];
    Object.entries(data).forEach(([date, audit]) => {
      audit.items.forEach((item, start) => {
        const auditData = item.toJS();
        if (filters.every(filter => filter(auditData))) {
          audits.push({ data: auditData, date, start });
        }
      });
    });
    return audits;
  };

  handleClickRefresh = () => {
    this.handleRefresh();
  };

  handleRefresh = (reset = true) => {
    const { router } = this.props;
    const location = router.getCurrentLocation();
    const { begin, start = 0, date = 'infinity' } = location.query;
    const dates = listDateRange(begin, date);
    const initData = [{ date, start: reset ? 0 : Number(start, 10) }]
      .concat(dates.slice(0, dates.length - 1).map(d => ({ date: d, start: 0 })));
    const filters = this.parseFiltersFromURL();

    this.props.onSyncAuditLogDates(initData);
    const { page } = this.state;
    this.loadContent(filters, page);
  };

  handleSearchWithKeywords = ({ search, keywords, exclude }) => {
    const filters = (
      (search in filterMap && keywords)
        ? [filterMap[search](keywords, exclude)] : []);
    this.props.onClear();
    this.setState({ page: 1 });
    this.loadContent(filters);
    this.redirectWithQuery({ search, keywords, exclude: Number(exclude, 10), start: 0 });
  };

  handleSearchWithDateRange = ({ beginAt, endAt }) => {
    const initData = listDateRange(beginAt, endAt).map(d => ({ date: d, start: 0 }));
    this.props.onSyncAuditLogDates(initData);
    this.setState({ page: 1 });
    this.loadContent();
    this.redirectWithQuery({ begin: beginAt.slice(0, 10), date: endAt.slice(0, 10) });
  };

  handleAuditRollback = (auditID, applicationName) => {
    this.props.onAuditRollback(applicationName, auditID);
  };

  handlePagination = page => () => {
    const { audits, fetchedAll } = this.props;
    const pages = Math.floor(audits.length / this.pageSize);
    this.setState({ page });
    if (pages < page && !fetchedAll) {
      const filters = this.parseFiltersFromURL();
      this.loadContent(filters, page);
    }
  };

  handleCancelSearch = () => {
    const { onCancelSearch } = this.props;
    onCancelSearch();
  };

  canRollback = (item) => {
    if (TYPES_CAN_ROLLBACK.indexOf(item.actionName) === -1 || item.rollbackTo) {
      return false;
    }
    if (checkIsDesensitized(item.actionData)
      && TYPES_NO_SECRET_DATA.indexOf(item.actionName) === -1) {
      return false;
    }
    if (item.actionName === TYPE_DELETE_SERVICE) {
      const { key } = item.actionData;
      const containerId = ContainerId.parse(key);
      if (!containerId.isEmpty && item.user) {
        return false;
      }
    }
    if (item.actionName === TYPE_UPDATE_INFRA_CONFIG
        || item.actionName === TYPE_DELETE_INFRA_CONFIG) {
      const { data } = item.actionData;
      if (!data) {
        return false;
      }
    }
    if (item.actionName === TYPE_DELETE_ROUTE) {
      if (!item.actionData.destClusterName) {
        return false;
      }
    }
    return true;
  };

  fillNewIsEncrypted = (audit, encryptedKeys) => {
    let newIsEncrypted = false;
    if (checkIsConfigAction(audit.actionName)) {
      const { actionData } = audit;
      const key = `${actionData.key}#${actionData.clusterName}`;
      if (encryptedKeys.includes(key)) {
        newIsEncrypted = true;
      } else {
        const isEncrypted = detectEncryptedData(actionData.data && actionData.data.new);
        if (isEncrypted) {
          encryptedKeys.push(key);
          newIsEncrypted = true;
        }
      }
    }
    const newActionData = Object.assign({}, audit.actionData, { newIsEncrypted });
    return Object.assign({}, audit, { actionData: newActionData });
  };

  renderAction = (item) => {
    const ActionType = types[item.actionName];
    return (
      ActionType
        ? <ActionType key={item.id} action={item} />
        : <div className="unknown-action">{item.actionName}</div>
    );
  };

  renderError = () => {
    const { error } = this.props;
    if (error) {
      return (
        <Alert status="error" message={error}><span>{error}</span></Alert>
      );
    }
    return null;
  };

  renderContent = () => {
    const { audits } = this.props;
    const { page } = this.state;
    const index = (page - 1) * this.pageSize;
    const encryptedKeys = [];

    return audits.slice(index, index + this.pageSize)
      .map(item => item.data)
      .map(item => Object.assign({}, item, { createdAt: new Date(Date.parse(item.createdAt)) }))
      .map(item => Object.assign({}, item, { actionData: parseData(item.actionData) }))
      .map(item => Object.assign({}, item,
        { actionData: _.mapKeys(item.actionData, (u, k) => camelCase(k)) }))
      .map(item => this.fillNewIsEncrypted(item, encryptedKeys))
      .map((item) => {
        const idc = getIDC(item.remoteAddr);
        return (
          <tr key={item.id}>
            <td className="user">
              <UserLabel user={item.user} />
            </td>
            <td className="action">{this.renderAction(item)}</td>
            <td className="remote">{item.remoteAddr}{idc && <span className="ip">[{idc}]</span>}</td>
            <td
              title={`${item.createdAt.toLocaleDateString()} `
                     + `${item.createdAt.toLocaleTimeString()}`}
            >
              <DateTime value={item.createdAt} />
            </td>

            <td>
              <Button
                disabled={!this.canRollback(item)}
                onClick={() => dialog.then(c => c.popup(
                  <DialogConfirm
                    onYes={() => {
                      this.handleAuditRollback(item.id, item.actionData.applicationName);
                      c.close();
                    }}
                    onNo={() => c.close()}
                    description="rollback with this audit log"
                  />,
                ))}
                title="rollback with this audit log"
              >
                rollback
              </Button>
            </td>
          </tr>
        );
      });
  };

  render() {
    const { isFetching, router, fetchedAll, audits, canceled, fetchEnd } = this.props;
    const { page } = this.state;
    const pages = Math.ceil(audits.length / this.pageSize);
    const hasNext = !fetchedAll || page < pages;
    const hasPrev = page !== 1;
    const { query } = router.getCurrentLocation();

    return (
      <div className="view-audit">
        <div className="view-audit__filter">
          <AuditSearch defaultValue={query} onSearch={this.handleSearchWithKeywords} />
          <div className="view-audit__cancel">
            {!fetchEnd && <Button className="view-audit__cancel--action" onClick={this.handleCancelSearch}>取消继续搜索</Button>}
            {fetchEnd && canceled && (
              <span className="view-audit__cancel--done">
                已取消继续搜索，下面的内容不一定是完整的搜索结果
              </span>
            )}
          </div>
          <div className="pull-right">
            <DatePicker
              defaultValue={{ beginAt: query.begin, endAt: query.date }}
              onChange={this.handleSearchWithDateRange}
            />
            <span className="page-index">Page {page}</span>
            <Button onClick={this.handlePagination(page - 1)} disabled={!hasPrev || isFetching}>
              <Octicon name="chevron-left" />
            </Button>
            <Button onClick={this.handlePagination(page + 1)} disabled={!hasNext || isFetching}>
              <Octicon name="chevron-right" />
            </Button>
          </div>
        </div>
        <div className="view-audit__content">
          <Table loading={this.props.isFetching}>
            <thead>
              <tr>
                <td>User</td>
                <td>Action</td>
                <td>IP</td>
                <td>Time</td>
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
              {this.renderContent()}
            </tbody>
          </Table>
          {this.renderError()}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { entity, audit } = state;
  const isFetching = audit.get('isFetching');
  let canceled = audit.get('canceled');
  let fetchEnd = audit.get('end');
  const auditData = audit
    .get('data')
    .sortBy((value, key) => key)
    .reverse()
    .toJS();
  const audits = _.flatten(_.entries(auditData).map(([date, result]) => {
    const items = denormalize(result.items, [schemas.auditSchema], entity);
    return items.map((item) => {
      const data = item.toJS();
      const index = result.record.indexOf(data.id) + result.start;
      return { data, date, index };
    });
  }));
  const first = _.first(Object.values(auditData));
  const fetchedAll = first ? first.fetchedAll : false;
  const auditError = audit.get('error');
  const error = auditError == null ? auditError : 'Audit log 搜索失败, 请刷新重试';
  if (auditError) {
    canceled = true;
    fetchEnd = true;
  }
  return { isFetching, error, audits, fetchedAll, canceled, fetchEnd };
}

function mapDispatchToProps(dispatch) {
  return {
    onLoad: (indexType, indexScope, filters, page) => {
      dispatch(actions.fetchAuditLogs(indexType, indexScope, filters, page));
    },
    onSyncAuditLogDates: (initData) => {
      dispatch(actions.syncAuditLogDates(initData));
    },
    onClear: () => {
      dispatch(actions.discardAuditLogs());
    },
    onAuditRollback: (applicationName, auditID) => {
      dispatch(actions.rollbackAuditLog(applicationName, auditID));
    },
    onCancelSearch: () => {
      dispatch(actions.cancelFetchAuditLogs());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AuditIndex);
