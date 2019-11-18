import React from 'react';
import PropTypes from 'prop-types';
import './timeline.sass';

export default function Timeline({ title, isLast }) {
  return (
    <div className="timeline">
      <div className="timeline__head">
        {!isLast && (
          <div className="timeline__line">
            <i className="timeline__line-inner" />
          </div>
        )}
        <span className="timeline__icon" />
      </div>
      <div className="timeline__main">
        <div className="timeline__title">{title}</div>
        <div className="timeline__description" />
      </div>
    </div>
  );
}

Timeline.propTypes = {
  title: PropTypes.string.isRequired,
  isLast: PropTypes.bool,
};

Timeline.defaultProps = {
  isLast: false,
};
