import React from 'react';
import DialogConfirm from '../../components/dialog/confirm';
import dialog from '../dialog';

export default function prompt(text) {
  dialog.then(c => c.popup(<DialogConfirm
    canChoose={false}
    content={text}
    onYes={c.close}
  />));
}
