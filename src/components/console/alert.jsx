import React from 'react';
import PropTypes from 'prop-types';
import Alert from '../alert';
import * as errors from '../../constants/errors';
import './alert.sass';

export default function ErrorAlert(props) {
  const { status } = props;
  let { message } = props;
  switch (status) {
    case errors.NO_AUTH_ERROR:
      message = (
        <span>
          您没有进行此项操作的权限
        </span>
      );
      break;
    case errors.CONFLICT_ERROR:
      message = (
        <span>
          资源修改版本冲突, 请刷新页面重试.
        </span>
      );
      break;
    default:
      message = <span>{message}</span>;
  }
  return (
    <Alert type="info">
      {message}
    </Alert>
  );
}

ErrorAlert.propTypes = {
  status: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
};
