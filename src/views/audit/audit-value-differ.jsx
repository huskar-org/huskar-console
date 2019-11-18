import React from 'react';
import PropTypes from 'prop-types';
import GitDiff from '../../components/gitdiff';
import { handlePressEnterKey } from '../../components/utils';
import './audit-value-differ.sass';

export default class AuditValueDiffer extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    oldValue: PropTypes.string,
    newValue: PropTypes.string,
  };

  static defaultProps = {
    oldValue: '',
    newValue: '',
  };

  state = {
    useGitDiff: true,
  };

  handleClickToggleGitDiff = () => {
    const { useGitDiff } = this.state;
    this.setState({ useGitDiff: !useGitDiff });
  };

  render() {
    const { children, oldValue, newValue } = this.props;
    const { useGitDiff } = this.state;
    let childrenNode = children;
    let hasDiff = false;
    if (oldValue && newValue && newValue !== oldValue) {
      hasDiff = true;
      if (useGitDiff) {
        childrenNode = (
          <div className="detail">
            <GitDiff oldStr={oldValue || ''} newStr={newValue || ''} />
          </div>
        );
      }
    }

    return (
      <div className="view-audit__content-differ">
        <div className="view-audit__content">
          <div className="action action--diff">
            {childrenNode}
            {hasDiff && (
              <div
                className="view-audit__content-differ__toggle"
                role="link"
                tabIndex={0}
                onClick={this.handleClickToggleGitDiff}
                onKeyPress={handlePressEnterKey(this.handleClickToggleGitDiff)}
              >
                {useGitDiff ? '切换为方便复制的格式' : '切换为 Git Diff 格式'}
              </div>
            )}
          </div>
        </div>
      </div>);
  }
}
