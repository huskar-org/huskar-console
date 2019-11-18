import React from 'react';
import PropTypes from 'prop-types';
import './dropdown.sass';

export default function Dropdown({
  dpButton,
  children,
  className,
  pullRight,
}) {
  return (
    <div className={className ? `dropdown ${className}` : 'dropdown'}>
      <div className="dropdown-button">{ dpButton }</div>
      <div className={pullRight ? 'dropdown-menus dropdown-menus--right' : 'dropdown-menus'}>
        { children }
      </div>
    </div>
  );
}

Dropdown.propTypes = {
  dpButton: PropTypes.element.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  pullRight: PropTypes.bool,
};

Dropdown.defaultProps = {
  className: null,
  pullRight: false,
};
