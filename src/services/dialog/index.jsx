import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import Container from './container';
import store from '../../store';

const view = document.createElement('dialog-view');
const dialog = new Promise((resolve, reject) => {
  try {
    ReactDOM.render(
      <Provider store={store}>
        <Container ref={(c) => { resolve(c); }} />
      </Provider>,
      view,
    );
  } catch (e) {
    reject(e);
  }
});

window.addEventListener('keyup', (event) => {
  if (event.keyCode === 27) {
    dialog.then((c) => { c.close(); });
  }
});

const onLoad = () => document.body.appendChild(view);

if (document.body) {
  onLoad();
} else {
  window.addEventListener('load', onLoad);
}

export default dialog;
