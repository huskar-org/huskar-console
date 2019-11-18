import React from 'react';
import PropTypes from 'prop-types';
import Octicon from 'react-octicon';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import DialogConfirm from './dialog/confirm';
import dialog from '../services/dialog';
import * as actions from '../actions';
import * as schemas from '../constants/schemas';
import * as hosts from '../constants/hosts';
import * as hrefs from '../constants/hrefs';
import * as text from '../constants/text';
import { SUMMIT_HOUR_HOST_WHITELIST } from '../constants/alarm';
import './header.sass';


function navLinks(currentUser) {
  const links = [];
  if (currentUser && currentUser.get('isAdmin')) {
    links.push(<Link to="/user" key="user" activeClassName="active">User List</Link>);
    links.push(<Link to="/team" key="team" activeClassName="active">Team List</Link>);
  }
  links.push(<Link to="/audit" key="audit" activeClassName="active">Audit Log</Link>);
  links.push(<Link to="/route-program" key="route-program" activeClassName="active">SOA Route Program</Link>);
  return links;
}

function showSummitHourDialog(event) {
  if (event) event.preventDefault();
  dialog.then(c => c.popup(<DialogConfirm
    canChoose={false}
    content={text.SUMMIT_HOUR_NOTICE}
    onYes={c.close}
  />));
}

function Header({
  minimalModeTimes,
  minimalModeBadge,
  summitHourBadge,
  currentUser,
  onClickMinimalModeBadge,
}) {
  const { stageName } = hosts;
  const ignoreSummitHourBadge = SUMMIT_HOUR_HOST_WHITELIST.indexOf(stageName) !== -1;
  const productionWarn = (stageName === 'production'
    ? <span className="badge-label">生产环境 - 业务高峰期</span>
    : <span className="badge-label">业务高峰期</span>
  );
  const productionLabel = stageName === 'production' && (
    <span
      title="生产环境"
      className="emergency"
    >
      <Octicon name="stop" />
      <span className="badge-label">生产环境</span>
    </span>
  );
  let stageNames = hosts.DEPLOYMENT_LINKS.map(hostObj => hostObj.name);
  if (!stageNames.includes(stageName)) {
    stageNames = [stageName, ...stageNames];
  }
  const handleStageChange = (e) => {
    const name = e.target.value;
    if (name === stageName) return;
    const newHost = hosts.DEPLOYMENT_LINKS.find(r => r.name === name);
    if (newHost) {
      const newHref = new URL(newHost.href);
      newHref.pathname = window.location.pathname;
      window.location.assign(newHref.href);
    }
  };
  return (
    <header className={`header env-${stageName}`}>
      <h1>
        <Link to="/" activeClassName="active">
          Huskar<span className="stage">{stageName}</span>
        </Link>
      </h1>
      <nav>{[...navLinks(currentUser)]}</nav>
      <aside>
        <select value={stageName} onChange={handleStageChange}>
          {stageNames.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
        {minimalModeBadge && (
          <a
            title={text.MINIMAL_MODE_NOTICE(minimalModeTimes)}
            href="#minimal-mode"
            onClick={onClickMinimalModeBadge}
          >
            <Octicon name="zap" />
            <span className="badge-label">{minimalModeTimes}</span>
          </a>
        )}
        {summitHourBadge && !ignoreSummitHourBadge ? (
          <a
            title={text.SUMMIT_HOUR_NOTICE}
            href="#summit-hour"
            onClick={showSummitHourDialog}
            className="emergency"
          >
            <Octicon name="stop" />
            {productionWarn}
          </a>
        ) : productionLabel}
        <a
          target="_blank"
          rel="noopener noreferrer"
          title="阅读 Huskar 用户手册"
          href={hrefs.USER_MANUAL_URL}
        >
          <Octicon name="book" /> 手册
        </a>
        <a
          target="_blank"
          rel="noopener noreferrer"
          title="反馈 Bug 或其他问题"
          href={hrefs.HUSKAR_ISSUE_URL}
        >
          <Octicon name="issue-opened" /> 反馈
        </a>
        <Link to="/profile" activeClassName="active">
          {currentUser && !currentUser.get('isAnonymous')
            ? currentUser.get('username')
            : 'Anonymous'}
        </Link>
      </aside>
    </header>
  );
}

Header.propTypes = {
  minimalModeTimes: PropTypes.number.isRequired,
  minimalModeBadge: PropTypes.bool.isRequired,
  summitHourBadge: PropTypes.bool.isRequired,
  onClickMinimalModeBadge: PropTypes.func.isRequired,
  currentUser: PropTypes.instanceOf(schemas.UserSession),
};

Header.defaultProps = {
  currentUser: null,
};

function mapStateToProps(state) {
  const { minimal, alarm } = state;
  const punchWindow = minimal.get('punchWindow');
  const minimalModeTimes = punchWindow.count(v => v);
  const minimalModeBadge = (
    minimalModeTimes > 0 && minimalModeTimes >= (punchWindow.size / 3.0)
  );
  const summitHourBadge = alarm.get('isSummitHour');
  const currentUser = schemas.userSessionSelector(state);
  return {
    minimalModeTimes,
    minimalModeBadge,
    summitHourBadge,
    currentUser,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onClickMinimalModeBadge: (event) => {
      event.preventDefault();
      dispatch(actions.flushMinimalMode());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Header);
