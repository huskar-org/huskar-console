import React from 'react';
import ReactDOM from 'react-dom';
import {
  Router, Route, IndexRoute, Redirect, IndexRedirect, browserHistory,
} from 'react-router';
import { Provider } from 'react-redux';
import store from './store';
import {
  Root,
  NotFound,
  SignIn,
  SignInPasswordReset,
  User,
  Team,
  Profile,
  AuditSite,
  AuditApplication,
  AuditTeam,
  AuditTimeline,
  InfraDownstream,
  RouteProgram,
  Config,
  Switch,
  Service,
} from './views';
import setupStageInfo from './views/utils';
import Console from './components/console';
import SimpleConsole from './components/console/simple';
import ClusterEditor from './components/console/cluster';
import Privilege from './components/console/privilege';
import TeamAdmin from './components/console/teamadmin';
import AppList from './components/console/applist';
import { setupSummitHourAlarm, setupWellKnownData } from './actions';

const root = (
  <Route path="/" component={Root}>
    <IndexRoute component={Console} />

    <Route path="signin" component={SignIn} />
    <Route path="password-reset" component={SignInPasswordReset} />
    <Route path="password-reset/:username/:token" component={SignInPasswordReset} />
    <Route path="user" component={User} />
    <Route path="team" component={Team} />
    <Route path="profile" component={Profile} />

    <Route path="team/:teamName" component={Console}>
      <Route path="teamadmin" component={TeamAdmin} />
      <Route path="applist" component={AppList} />
      <Route path="audit" component={AuditTeam} />
    </Route>
    <Route path="application/:applicationName" component={Console}>
      <IndexRedirect to="service" />
      <Route path="service" component={Service}>
        <Route path="cluster/:clusterName" component={ClusterEditor} />
      </Route>
      <Route path="switch" component={Switch} />
      <Route path="config" component={Config} />
      <Route path="privilege" component={Privilege} />
      <Route path="audit">
        <IndexRoute component={AuditApplication} />
        <Route path="timeline/:instanceType/:clusterName/:instanceKey" component={AuditTimeline} />
      </Route>
      <Route path="infra-downstream" component={InfraDownstream} />
    </Route>
    <Route path="audit" component={SimpleConsole}>
      <IndexRoute component={AuditSite} />
    </Route>

    <Route path="console">
      <IndexRedirect to="/" />
      <Redirect from=":teamName/teamadmin" to="/team/:teamName/teamadmin" />
      <Redirect from=":teamName/applist" to="/team/:teamName/applist" />
      <Redirect from=":applicationName/service" to="/application/:applicationName/service" />
      <Redirect from=":applicationName/switch" to="/application/:applicationName/switch" />
      <Redirect from=":applicationName/config" to="/application/:applicationName/config" />
      <Redirect from=":applicationName/privilege" to="/application/:applicationName/privilege" />
    </Route>

    <Route component={SimpleConsole.hideSidebar}>
      <Route path="route-program" component={RouteProgram} />
    </Route>

    <Route path="*" component={NotFound} />
  </Route>
);

setupSummitHourAlarm(store);
setupStageInfo();
setupWellKnownData(store);

ReactDOM.render(
  <Provider store={store}>
    <Router history={browserHistory}>
      {root}
    </Router>
  </Provider>,
  document.getElementById('root'),
);
