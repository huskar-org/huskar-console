import React from 'react';
import PropTypes from 'prop-types';
import { routerShape } from 'react-router';
import { SWITCH_RELATED_FIRST_LEVEL_PATHS } from '../../constants/common';
import Header from '../header';
import ApplicationTree from '../applicationtree';
import cx from './index.sass';

export default function SimpleConsole(props) {
  const { router } = props;
  const firstLevelRouter = router.routes && router.routes[1];
  const isSwitchPage = SWITCH_RELATED_FIRST_LEVEL_PATHS.some(
    v => v === (firstLevelRouter && firstLevelRouter.path),
  );
  return (
    <div className={cx.console}>
      <Header isSwitchPage={isSwitchPage} />
      <div className={cx.sidebar}>
        {props.hideSidebar
          ? null
          : <ApplicationTree params={props.params} router={props.router} />}
        {props.children}
      </div>
    </div>
  );
}

SimpleConsole.propTypes = {
  params: PropTypes.objectOf(PropTypes.string).isRequired,
  router: routerShape.isRequired,
  children: PropTypes.node,
  hideSidebar: PropTypes.bool,
};

SimpleConsole.defaultProps = {
  children: null,
  hideSidebar: false,
};

// The react-router does not allow to pass props freely
SimpleConsole.hideSidebar = props => (
  <SimpleConsole {...props} hideSidebar />
);
