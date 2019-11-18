import React from 'react';
import PropTypes from 'prop-types';
import Octicon from 'react-octicon';
import './user.sass';

export default function UserLabel({ user }) {
  let title;
  let username;
  let iconname;

  if (user && user.isApplication) {
    title = `"${user.username}" is an application.`;
  } else if (user && !user.isActive) {
    title = `"${user.username}" has been archived.`;
  } else {
    title = null;
  }

  if (!user) {
    username = <span>anonymous</span>;
  } else if (!user.isActive) {
    username = <del>{user.username}</del>;
  } else {
    username = <span>{user.username}</span>;
  }

  if (!user) {
    iconname = 'light-bulb';
  } else if (user.isApplication) {
    iconname = 'server';
  } else {
    iconname = 'person';
  }

  return (
    <span className="inline-user" title={title}>
      <span className="inline-user__icon"><Octicon name={iconname} /></span>
      {username}
    </span>
  );
}

UserLabel.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string,
    email: PropTypes.string,
    isActive: PropTypes.bool,
    isAdmin: PropTypes.bool,
    isApplication: PropTypes.bool,
  }),
};

UserLabel.defaultProps = {
  user: null,
};
