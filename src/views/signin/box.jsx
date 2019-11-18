import React from 'react';
import PropTypes from 'prop-types';
import Octicon from 'react-octicon';
import * as hrefs from '../../constants/hrefs';
import './box.sass';

export default function Box({ title, children }) {
  return (
    <dl className="signin">
      <dt className="signin__titlebar">
        {title}
        <a
          className="btn-link"
          title="联系 Huskar 团队"
          href={hrefs.HUSKAR_ISSUE_URL}
        >
          <Octicon name="comment-discussion" />
          <span className="signin__customer-service">反馈问题</span>
        </a>
      </dt>
      <dd>{children}</dd>
    </dl>
  );
}

Box.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};
