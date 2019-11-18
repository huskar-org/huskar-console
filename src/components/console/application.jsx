import React from 'react';
import PropTypes from 'prop-types';
import TopBar from './topbar';
import cx from './application.sass';

export default function Application(props) {
  return (
    <div className={cx.application}>
      <TopBar params={props.params} />
      {props.children}
    </div>
  );
}

Application.propTypes = {
  children: PropTypes.node,
  params: PropTypes.shape({
    applicationName: PropTypes.string.isRequired,
  }).isRequired,
};

Application.defaultProps = {
  children: null,
};
