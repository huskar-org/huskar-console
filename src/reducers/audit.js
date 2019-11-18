import Immutable from 'immutable';
import * as types from '../constants/actiontypes';

const initialState = new Immutable.Map({
  isFetching: false,
  data: new Immutable.OrderedMap(),
  error: null,
  timeline: new Immutable.Map({
    isFetching: false,
    items: new Immutable.OrderedSet(),
  }),
  limit: 20,
  canceled: false,
  end: false,
});

const Audits = new Immutable.Record({
  items: new Immutable.List(),
  fetchedAll: false,
  record: new Immutable.List(),
  start: 0,
});

export default function audit(state = initialState, action) {
  switch (action.type) {
    case types.SYNC_DATE_OF_AUDIT_LOGS:
      return action.dates.reduce(
        (newState, { date, start }) => newState.setIn(['data', date], new Audits({ start })),
        state.set('data', new Immutable.OrderedMap()),
      );
    case types.REQUEST_AUDIT_LOGS:
      return state.set('isFetching', true).set('canceled', false).set('end', false);
    case types.RECEIVE_AUDIT_LOGS: {
      if (action.error) {
        return state
          .set('error', action.error)
          .set('isFetching', false);
      }
      return state
        .updateIn(['data', action.date, 'items'], items => items.concat(action.result))
        .updateIn(['data', action.date, 'record'], record => record.concat(action.record))
        .setIn(['data', action.date, 'fetchedAll'], action.fetchedAll)
        .set('error', null)
        .set('isFetching', false);
    }
    case types.DISCARD_AUDIT_LOGS:
      return state.update('data', data => data.map(() => new Audits()));
    case types.REQUEST_INSTANCE_AUDIT_LOGS:
      return state.set('isFetching', true).set('canceled', false).set('end', false);
    case types.RECEIVE_INSTANCE_AUDIT_LOGS: {
      const newState = (action.refresh || action.start === 0) ? initialState : state;
      if (action.error) {
        return state.setIn(['timeline', 'items'], new Immutable.OrderedSet())
          .set('error', action.error)
          .set('isFetching', false);
      }
      let items = newState.getIn(['timeline', 'items']) || new Immutable.OrderedSet();
      items = items.concat(action.result).sort((a, b) => b - a);
      return newState.setIn(['timeline', 'items'], items)
        .set('isFetching', false);
    }
    case types.CANCEL_REQUEST_AUDIT_LOGS: {
      return state.set('canceled', true);
    }
    case types.REQUEST_AUDIT_LOGS_END: {
      return state.set('end', true).set('isFetching', false);
    }
    default:
      return state;
  }
}
