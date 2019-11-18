import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import './application.sass';

export default function ApplicationLabel({ value, children, href, className }) {
  const title = `Application: ${value}`;
  const path = href || `/application/${value}/service`;
  return (
    <span
      className={
        className ? `inline-application ${className}` : 'inline-application'
      }
      title={title}
    >
      <span
        className={[
          'inline-application__name',
          children && 'inline-application__name--with-children',
        ].filter(x => x).join(' ')}
      >
        <Link to={path} className="inline-application__badge">
          <i className="inline-application__badge-icon" />
        </Link>
        {value}
      </span>
      {children && (
        <span className="inline-application__children">
          {children}
        </span>
      )}
    </span>
  );
}

ApplicationLabel.propTypes = {
  value: PropTypes.string.isRequired,
  children: PropTypes.element,
  href: PropTypes.string,
  className: PropTypes.string,
};

ApplicationLabel.defaultProps = {
  children: null,
  href: null,
  className: '',
};
