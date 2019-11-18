import React from 'react';
import ReactDOM from 'react-dom';
import Container from './container';

// TODO Use React-Portal instead of this thing
const view = document.createElement('toast-view');
const onLoad = () => document.body.appendChild(view);
const toast = new Promise((resolve, reject) => {
  try {
    ReactDOM.render(<Container ref={(c) => { resolve(c); }} />, view);
  } catch (e) {
    reject(e);
  }
});

if (document.body) {
  onLoad();
} else {
  window.addEventListener('load', onLoad);
}

export default content => toast.then(c => c.draw(content));
