import React from 'react';
import PropTypes from 'prop-types';
import './card.sass';

export default function Card({ header, children }) {
  return (
    <div className="card">
      {header && <div className="card__header">{header}</div>}
      <div className="card__body">
        {children}
      </div>
    </div>
  );
}

Card.propTypes = {
  header: PropTypes.element,
  children: PropTypes.element,
};

Card.defaultProps = {
  header: null,
  children: null,
};
