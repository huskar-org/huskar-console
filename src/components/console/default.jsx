import React from 'react';
import cx from './default.sass';
import * as constants from '../../constants/hosts';

export default function Default() {
  const { hostname } = window.location;
  const host = constants.DEPLOYMENT_HOSTS.find(r => r.pattern.exec(hostname));
  return (
    <div className={cx.default}>
      Select an application please.
      <ul className={cx.links}>
        {constants.DEPLOYMENT_LINKS.map(({ name, href }) => (
          <li key={name}>
            <a href={href} className={host && host.name.startsWith(name) ? 'current' : ''}>
              {name}
            </a>
          </li>))}
      </ul>
    </div>
  );
}
