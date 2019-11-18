import React from 'react';
import PropTypes from 'prop-types';
import TopBar from './topbar';
import cx from './team.sass';

export default function Team(props) {
  return (
    <div className={cx.team}>
      <TopBar params={props.params} />
      {props.children}
    </div>
  );
}

Team.propTypes = {
  children: PropTypes.node,
  params: PropTypes.shape({
    teamName: PropTypes.string.isRequired,
  }).isRequired,
};
Team.defaultProps = {
  children: null,
};
