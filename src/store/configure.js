import { createStore, applyMiddleware } from 'redux';
import ReduxThunk from 'redux-thunk';
import ReduxRaven from 'redux-raven-middleware';
import reducer from '../reducers';
import { DEBUG } from '../constants/env';

function getEnhancer() {
  /* eslint-disable no-underscore-dangle */
  if (DEBUG && window.__REDUX_DEVTOOLS_EXTENSION__) {
    return window.__REDUX_DEVTOOLS_EXTENSION__();
  }
  /* eslint-enable */
  return undefined;
}

const createStoreWithMiddleware = applyMiddleware(...[
  ReduxThunk,
  DEBUG ? null : ReduxRaven(process.env.HUSKAR_SENTRY_DSN, {
    release: process.env.HUSKAR_RELEASE_ID,
  }),
].filter(x => x))(createStore);

export default function configureStore(initialState) {
  return createStoreWithMiddleware(reducer, initialState, getEnhancer());
}
