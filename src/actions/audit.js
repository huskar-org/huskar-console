import { normalize } from 'normalizr';
import _ from 'lodash';
import api from '../services/api';
import * as types from '../constants/actiontypes';
import { auditSchema } from '../constants/schemas';
import { createAction } from './utils';

export function syncAuditLogDates(dates) {
  return { type: types.SYNC_DATE_OF_AUDIT_LOGS, dates };
}

export function discardAuditLogs() {
  return { type: types.DISCARD_AUDIT_LOGS };
}

export function cancelFetchAuditLogs() {
  return { type: types.CANCEL_REQUEST_AUDIT_LOGS };
}

export function fetchAuditLogsEnd() {
  return { type: types.REQUEST_AUDIT_LOGS_END };
}

export function fetchAuditLogs(type, name, filters = [], page = 1, limit = 20) {
  if (!(
    type === 'site' || ((type === 'team' || type === 'application') && name)
  )) throw new Error('unexpected arguments');
  const requestAPI = name ? api.audit[type](name) : api.audit[type];

  function dispatchAction(dispatch, getState, checkCancel = false) {
    const { audit } = getState();
    const canceled = audit.get('canceled');
    if (checkCancel && canceled) {
      dispatch(fetchAuditLogsEnd());
      return null;
    }
    const dataLength = _.sum(_.values(audit.get('data').toJS()).map(x => x.items.length));
    if (dataLength >= page * limit) {
      dispatch(fetchAuditLogsEnd());
      return null;
    }
    audit.get('data').filterNot(data => data.get('fetchedAll'));
    const next = audit.get('data').filterNot(data => data.get('fetchedAll')).take(1);
    if (next.size === 0) {
      dispatch(fetchAuditLogsEnd());
      return null;
    }
    const [[date, nextData]] = Object.entries(next.toJS());
    const start = nextData.start + nextData.record.length;

    return createAction({
      request: () => requestAPI.get({ date, start }),
      payload: { date },
      response: ({ data }) => {
        const record = data.data.map(x => x.id);
        const audits = data.data.filter(item => filters.every(filter => filter(item)));
        const { entities, result } = normalize(audits, [auditSchema]);
        const fetchedAll = record.length < limit;
        return { entities, result, record, date, start, fetchedAll };
      },
      types: [
        types.REQUEST_AUDIT_LOGS,
        types.RECEIVE_AUDIT_LOGS,
      ],
      next: () => dispatchAction(dispatch, getState, true),
    })(dispatch);
  }
  return dispatchAction;
}

export function fetchInstanceTimeline(
  instanceType,
  applicationName,
  clusterName,
  instanceKey,
  start = 0,
  refresh = false,
) {
  return (dispatch) => {
    dispatch({ type: types.REQUEST_INSTANCE_AUDIT_LOGS });
    const request = api['audit-timeline'][instanceType](applicationName)(clusterName)(instanceKey);
    request.get({ start }).then(({ status, data }) => {
      if (status < 400) {
        const { entities, result } = normalize(data.data, [auditSchema]);
        dispatch({ type: types.RECEIVE_INSTANCE_AUDIT_LOGS, entities, result, refresh, start });
      } else {
        const error = data ? data.message : 'Unknown error';
        dispatch({ type: types.RECEIVE_INSTANCE_AUDIT_LOGS, error, start });
      }
    });
  };
}

export function revertInstance(
  instanceType,
  applicationName,
  clusterName,
  key,
  value,
) {
  return (dispatch) => {
    const request = api[instanceType](applicationName)(clusterName);
    const data = { key, value };
    request.post(data)
      .then(({ status }) => {
        if (status < 400) {
          fetchInstanceTimeline(instanceType, applicationName, clusterName, key, 0, true)(dispatch);
        }
      });
  };
}

export function rollbackAuditLog(applicationName, auditId) {
  return (dispatch, getState) => {
    const request = api['audit-rollback'](applicationName)(auditId);
    dispatch({ type: types.ROLLBACK_AUDIT_LOG_BEGIN });
    request.put().then(({ status, data }) => {
      if (status < 400) {
        dispatch({ type: types.ROLLBACK_AUDIT_LOG_END });
        dispatch(discardAuditLogs());
        fetchAuditLogs('application', applicationName, [])(dispatch, getState);
      } else {
        const error = data ? data.message : 'Unknown error';
        dispatch({ type: types.ROLLBACK_AUDIT_LOG_END, error });
      }
    });
  };
}
