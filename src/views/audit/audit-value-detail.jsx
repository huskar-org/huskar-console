import React from 'react';
import PropTypes from 'prop-types';
import { handlePressEnterKey } from '../../components/utils';
import dialog from '../../services/dialog';
import AuditValueDiffer from './audit-value-differ';
import './audit-value-detail.sass';

export default class AuditValueDetail extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    oldValue: PropTypes.string,
    newValue: PropTypes.string,
  };

  static defaultProps = {
    oldValue: '',
    newValue: '',
  };

  handleClickDetail = () => {
    const { children, oldValue, newValue } = this.props;
    dialog.then(c => c.popup(
      <AuditValueDiffer oldValue={oldValue} newValue={newValue}>
        {children}
      </AuditValueDiffer>,
    ));
  };

  render() {
    const { children } = this.props;

    return (
      <div
        className="view-audit__content-detail"
        onClick={this.handleClickDetail}
        onKeyPress={handlePressEnterKey(this.handleClickDetail)}
        role="link"
        tabIndex={0}
        title="点击查看详情"
      >
        {children}
      </div>);
  }
}
