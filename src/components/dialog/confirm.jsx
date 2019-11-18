import React from 'react';
import PropTypes from 'prop-types';
import Button from '../button';
import cx from './confirm.sass';

export default class DialogConfirm extends React.Component {
  static propTypes = {
    onYes: PropTypes.func,
    onNo: PropTypes.func,
    canChoose: PropTypes.bool,
    content: PropTypes.string,
    description: PropTypes.string,
    additionalDescription: PropTypes.string,
    additionalNode: PropTypes.node,
    buttonTexts: PropTypes.shape({
      ok: PropTypes.string,
      yes: PropTypes.string,
      no: PropTypes.string,
    }),
    isDangerous: PropTypes.bool,
    additionalPageTurning: PropTypes.bool,
  };

  static defaultProps = {
    onYes: null,
    onNo: null,
    content: '',
    description: '',
    additionalDescription: '',
    buttonTexts: {},
    canChoose: true,
    isDangerous: true,
    additionalPageTurning: false,
    additionalNode: null,
  };

  state = {
    isKnow: false,
  };

  handlerIsKnow = () => {
    this.setState({ isKnow: true });
  }

  handleClickYes = () => {
    if (this.props.onYes) this.props.onYes();
  }

  handleClickNo = () => {
    if (this.props.onNo) this.props.onNo();
  }

  renderButtons = () => {
    const { buttonTexts, isDangerous, additionalPageTurning } = this.props;
    if (!this.props.canChoose) {
      return [
        <Button onClick={this.handleClickYes} key="ok">{ buttonTexts.ok ? buttonTexts.ok : 'OK' }</Button>,
      ];
    }
    const { isKnow } = this.state;
    let ret = [];
    if (!isKnow && additionalPageTurning) {
      ret = [
        <Button
          effect="default"
          type="primary"
          onClick={this.handlerIsKnow}
          key="yes"
        >
          { buttonTexts.ok ? buttonTexts.ok : 'OK' }
        </Button>,
        <span key="span">&nbsp;&nbsp;</span>,
        <Button onClick={this.handleClickNo} type="default" key="no">
          { buttonTexts.no ? buttonTexts.no : 'No' }
        </Button>,
      ];
    } else {
      ret = [
        <Button
          effect={isDangerous ? 'delay' : 'default'}
          type={isDangerous ? 'danger' : 'primary'}
          onClick={this.handleClickYes}
          key="yes"
        >
          { buttonTexts.yes ? buttonTexts.yes : 'Yes' }
        </Button>,
        <span key="span">&nbsp;&nbsp;</span>,
        <Button onClick={this.handleClickNo} type="default" key="no">
          { buttonTexts.no ? buttonTexts.no : 'No' }
        </Button>,
      ];
    }
    return ret;
  }

  render() {
    const { isKnow } = this.state;
    const { additionalPageTurning, additionalNode } = this.props;
    let { content } = this.props;
    const { description, additionalDescription } = this.props;
    if (!content) {
      if (description) {
        content = `Are you sure to ${description}?`;
      } else {
        content = 'Are you sure?';
      }
    }
    const htmlContent = { __html: additionalDescription };
    // eslint-disable-next-line react/no-danger
    return (
      <dl>
        <dt>Confirm</dt>
        <dd>
          <div className={cx.body}>
            {additionalPageTurning && !isKnow && <p className={cx.content}>{content}</p>}
            {additionalPageTurning && isKnow
             && <p className={cx.content} dangerouslySetInnerHTML={htmlContent} />}
            {!additionalPageTurning && <p className={cx.content}>{content}</p>}
            {!additionalPageTurning && additionalDescription
             && <p className={cx.content} dangerouslySetInnerHTML={htmlContent} />}
            {additionalNode}
            {this.renderButtons()}
          </div>
        </dd>
      </dl>
    );
  }
}
