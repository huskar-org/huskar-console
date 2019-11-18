import React from 'react';
import PropTypes from 'prop-types';
import './table.sass';

export default function Table({
  children,
  className,
  loading,
  collapsed,
  collapsedTitle,
  onClickExpand,
}) {
  const cx = className ? `table ${className}` : 'table';
  return (
    <div className={cx}>
      {loading && (
        <div className="table__loading">
          <div className="table__loading-inner">
            <i className="table__loading-icon" />
          </div>
        </div>
      )}
      {collapsed && !loading ? (
        <div className="table__collapsed">
          <a className="table__collapsed-a" href="#expand" onClick={onClickExpand}>
            + 点击展开{collapsedTitle}
          </a>
        </div>
      ) : (
        <table className="table__table">
          {children}
        </table>
      )}
    </div>
  );
}

Table.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  loading: PropTypes.bool,
  collapsed: PropTypes.bool,
  collapsedTitle: PropTypes.string,
  onClickExpand: PropTypes.func,
};

Table.defaultProps = {
  children: null,
  className: null,
  loading: false,
  collapsed: false,
  collapsedTitle: '内容',
  onClickExpand: null,
};
