import React from 'react';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Button from '../../../../components/button';
import KeyValue from '../../../../components/keyvalue';
import dialog from '../../../../services/dialog';
import * as actions from '../../../../actions';
import cx from './editor.sass';

class InfoEditor extends React.Component {
  static propTypes = {
    applicationName: PropTypes.isRequired,
    clusterName: PropTypes.string,
    onLoad: PropTypes.func.isRequired,
    onClear: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    onDiscard: PropTypes.func.isRequired,
    data: PropTypes.string.isRequired,
    error: PropTypes.string,
    isFetching: PropTypes.bool.isRequired,
  };

  static defaultProps = {
    clusterName: '',
    error: null,
  };

  constructor(props) {
    super(props);
    this.state = {
      value: {},
    };
  }

  componentDidMount() {
    const { clusterName, applicationName } = this.props;
    this.props.onLoad(applicationName, clusterName);
  }

  componentWillReceiveProps(nextProps) {
    const { data } = nextProps;
    this.setState({ value: data });
  }

  componentWillUnmount() {
    this.props.onDiscard();
  }

  handleClickSave = async () => {
    const { clusterName, applicationName } = this.props;
    const { value } = this.state;
    this.props.onSave(applicationName, clusterName, value);
    await dialog.then(c => c.close());
  };

  handleClickClear = async () => {
    const { applicationName, clusterName } = this.props;
    this.props.onClear(applicationName, clusterName);
    await dialog.then(c => c.close());
  };

  handleClickClose = async () => {
    this.props.onDiscard();
    await dialog.then(c => c.close());
  }

  handleChangeKeyValue = (items) => {
    const value = items
      .filter(v => v.key)
      .reduce((r, v) => r.set(v.key, v.value), new Immutable.Map())
      .toObject();
    this.setState({ value });
  }

  render() {
    const { applicationName, clusterName, error, isFetching } = this.props;
    const { value } = this.state;
    let title = (
      clusterName
        ? `${applicationName} - ${clusterName} :: Meta Info`
        : `${applicationName} :: Meta Info`);
    title = (isFetching && `${title} - loading`);
    if (error) {
      return (
        <dl key={title} className={cx.info}>
          <dt>{title}</dt>
          <dd>{error}</dd>
        </dl>
      );
    }

    return (
      <dl key={title} className={cx.info}>
        <dt>{title}</dt>
        <dd>
          <div className={isFetching ? 'loading' : ''} />
          <table>
            <tbody>
              <tr className="input-wrapper">
                <td>元信息: </td>
                <td>
                  <KeyValue
                    defaultValue={value}
                    onChange={this.handleChangeKeyValue}
                  />
                </td>
              </tr>
              <tr>
                <td />
                <td>
                  <Button
                    onClick={this.handleClickSave}
                    disabled={isFetching}
                    type="danger"
                    effect="delay"
                  >
                    Save
                  </Button>
                  &nbsp;&nbsp;
                  <Button
                    type="default"
                    onClick={this.handleClickClose}
                  >
                    Cancel
                  </Button>
                  &nbsp;&nbsp;
                  <Button
                    onClick={this.handleClickClear}
                    type="danger"
                    effect="delay"
                  >
                    Clear and Save
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </dd>
      </dl>
    );
  }
}

function mapStateToProps(state) {
  const serviceInfo = state.serviceInfo.toJS();
  return { ...serviceInfo };
}

function mapDispatchToProps(dispatch) {
  return {
    onLoad: (applicationName, clusterName = null) => {
      dispatch(actions.fetchServiceInfo(applicationName, clusterName));
    },
    onClear: (applicationName, clusterName = null) => {
      dispatch(actions.clearServiceInfo(applicationName, clusterName));
    },
    onSave: (applicationName, clusterName = null, data = {}) => {
      dispatch(actions.putServiceInfo(applicationName, clusterName, data));
    },
    onDiscard: () => {
      dispatch(actions.discardServiceInfo());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(InfoEditor);
