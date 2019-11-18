import React from 'react';
import XCeptor from 'xceptor';
import toast from '../toast';
import {
  RELEASE_WINDOW_READ_ONLY_ON,
  RELEASE_WINDOW_OPEN_FOR_EMERGENCY_USER,
  RELEASE_WINDOW_IN_RUSH_HOURS,
} from '../../constants/common';

XCeptor.when(/^(?!GET)/, /^/, null, (req, res) => {
  if (res.status < 400) {
    // toast('OK');
  } else {
    let message;
    try {
      const data = JSON.parse(res.responseText);
      message = data.message || data.status;
      const { headers } = res;
      headers.forEach((item) => {
        if (item.header === 'x-frontend-read-only') {
          if (item.value === RELEASE_WINDOW_READ_ONLY_ON) {
            message = '只读开关打开，您没有权限进行此项操作.';
          } else if (item.value === RELEASE_WINDOW_IN_RUSH_HOURS
            || item.value === RELEASE_WINDOW_OPEN_FOR_EMERGENCY_USER) {
            message = '变更窗口关闭.';
          }
        }
      });
      if (!message) {
        message = 'Internal server error occured';
      }
    } catch (e) {
      message = 'Unknown error occured';
    }
    toast(<span>{message}</span>);
  }
});
