import React from 'react';
import PropTypes from 'prop-types';
import { routerShape } from 'react-router';
import Header from 'components/header';
import ApplicationTree from 'components/applicationtree';
import { SWITCH_RELATED_THREE_LEVEL_PATHS } from '../../constants/common';
import Default from './default';
import Application from './application';
import Team from './team';
import cx from './index.sass';

function isLegacyApplicationName(applicationName) {
  return applicationName && applicationName.indexOf('@') !== -1;
}

export default class Console extends React.Component {
  static propTypes = {
    params: PropTypes.shape({
      applicationName: PropTypes.string,
      teamName: PropTypes.string,
    }).isRequired,
    router: routerShape.isRequired,
    children: PropTypes.node,
  };

  static defaultProps = {
    children: null,
  };

  componentDidMount() {
    const { params, router } = this.props;
    const { applicationName } = params;
    if (isLegacyApplicationName(applicationName)) {
      const location = router.getCurrentLocation();
      const paths = location.pathname.split('/').filter(x => x);
      const newTargetName = paths[paths.length - 1];
      const newApplicationName = applicationName.split('@', 1)[0];
      router.push(`/application/${newApplicationName}/${newTargetName}`);
    }
  }

  renderTarget() {
    const { children, params } = this.props;
    const { applicationName, teamName } = params;
    if (applicationName) {
      if (!isLegacyApplicationName(applicationName)) {
        return <Application params={params}>{children}</Application>;
      }
    } else if (teamName) {
      return <Team params={params}>{children}</Team>;
    }
    return <Default params={params}>{children}</Default>;
  }

  render() {
    const { params, router } = this.props;
    const { applicationName } = params;
    const threeLevelRouter = router.routes && router.routes[2];
    const isSwitchPage = SWITCH_RELATED_THREE_LEVEL_PATHS.some(
      v => v === (threeLevelRouter && threeLevelRouter.path),
    );
    return (
      <div className={cx.console}>
        <Header applicationName={applicationName} isSwitchPage={isSwitchPage} />
        <div className={cx.sidebar}>
          <ApplicationTree params={params} router={router} />
          { this.renderTarget() }
        </div>
      </div>
    );
  }
}
