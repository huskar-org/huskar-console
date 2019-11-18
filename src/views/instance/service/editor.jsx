import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import Immutable from 'immutable';
import { Cluster } from 'structures';
import { ClusterLabel } from '../../../components/inline';
import Button from '../../../components/button';
import TextField from '../../../components/textfield';
import KeyValue from '../../../components/keyvalue';
import StateSwitch from '../../../components/stateswitch';
import { isReservedClusterName } from '../../../components/utils';
import dialog from '../../../services/dialog';
import { FEATURE_LIST } from '../../../constants/env';
import { instanceValueShape } from './proptypes';
import './editor.sass';

export default class Editor extends React.Component {
  static propTypes = {
    defaultValue: instanceValueShape,
    key: PropTypes.string,
    title: PropTypes.string,
    onSubmit: PropTypes.func,
    isEditing: PropTypes.bool,
  };

  static defaultProps = {
    defaultValue: null,
    key: null,
    title: 'Edit',
    onSubmit: null,
    isEditing: false,
  };

  state = {
    value: {
      ip: null,
      port: null,
      state: null,
      meta: null,
    },
    clusterOnly: true,
  };

  componentDidMount() {
    dialog.then(c => c.onSubmit(this.handleClickSubmit));
  }

  handleToggleClusterOnly = (event) => {
    const clusterOnly = !event.target.checked;
    this.setState({ clusterOnly });
  };

  handleChangeZone = (event) => {
    const ezone = Cluster.getZone(event.target.value);
    this.setState(state => ({
      value: Object.assign({}, state.value, {
        cluster: this.collectForm(state).cluster.set('ezone', ezone).normalize(),
      }),
    }));
  }

  handleChangeClusterName = (event) => {
    const clusterName = event.target.value.trim();
    this.setState(state => ({
      value: Object.assign({}, state.value, {
        cluster: this.collectForm(state).cluster.set('clusterName', clusterName).normalize(),
      }),
    }));
  }

  handleChangeTextField = name => (event) => {
    let inputValue = event.target.value;
    if (inputValue.trim) {
      inputValue = inputValue.trim();
    }
    this.setState(state => ({
      value: Object.assign({}, state.value, { [name]: inputValue }),
    }));
  }

  handleChangeKeyValue = name => (items) => {
    const inputValue = items
      .filter(v => v.key)
      .reduce((r, v) => r.set(v.key, v.value), new Immutable.Map())
      .toObject();
    this.setState(state => ({
      value: Object.assign({}, state.value, { [name]: inputValue }),
    }));
  }

  handleClickSubmit = () => {
    const fields = this.collectForm();
    const { clusterOnly } = this.state;
    const { onSubmit, defaultValue } = this.props;
    const isEditing = defaultValue !== null;
    if (!onSubmit) {
      return;
    }
    onSubmit(fields, !isEditing && clusterOnly);
    dialog.then(c => c.close());
  }

  handleClickCancel = () => {
    dialog.then(c => c.close());
  }

  collectForm = (prevState) => {
    let { value } = this.state;
    if (prevState) {
      ({ value } = prevState);
    }
    const defaultValue = this.props.defaultValue || {};
    const defaultPort = value.port || defaultValue.port || {};
    let defaultCluster = Cluster.parse(value.cluster || defaultValue.cluster || '');
    if (defaultCluster.isEmpty) {
      defaultCluster = defaultCluster.set('ezone', Cluster.getZoneList()[0]).normalize();
    }
    return {
      cluster: defaultCluster,
      key: value.key || defaultValue.key || '',
      ip: value.ip || defaultValue.ip || '',
      port: _.mapValues(defaultPort, x => parseInt(x, 10)),
      state: value.state || defaultValue.state || 'down',
      meta: value.meta || defaultValue.meta || {},
    };
  }

  renderClusterFragment(isEditing, fields) {
    return (
      <table className="service-instance-editor__table">
        <tbody>
          <tr>
            <td className="service-instance-editor__label">
              {isEditing && 'Cluster'}
            </td>
            <td className="service-instance-editor__field">
              {fields.cluster.isEmpty
                ? <span>No Preview</span>
                : <ClusterLabel value={fields.cluster.toString()} />}
            </td>
          </tr>
          {!isEditing && (
            <tr>
              <td className="service-instance-editor__label">E-Zone</td>
              <td className="service-instance-editor__field">
                <select
                  className="service-instance-editor__input"
                  value={fields.cluster.get('ezone').name}
                  readOnly={isEditing}
                  onChange={this.handleChangeZone}
                >
                  {Cluster.getZoneList().map(ezone => (
                    <option value={ezone.name || ''} key={ezone.name || 'global'}>
                      {ezone.name ? `${ezone.name} (${ezone.idc})` : '-'}
                    </option>))}
                </select>
              </td>
            </tr>
          )}
          {!isEditing && (
            <tr>
              <td className="service-instance-editor__label">Cluster</td>
              <td className="service-instance-editor__field">
                <TextField
                  className="service-instance-editor__input"
                  value={fields.cluster.get('clusterName')}
                  onChange={this.handleChangeClusterName}
                  readOnly={isEditing}
                />
                {isReservedClusterName(fields.cluster.get('clusterName')) && (
                  <span className="service-instance-editor__text-error">
                    Reserved cluster name
                  </span>
                )}
              </td>
            </tr>
          )}
          {!isEditing && (
            <tr>
              <td className="service-instance-editor__label" />
              <td className="service-instance-editor__field">
                <label htmlFor="service-instance-editor-cluster-only">
                  <input
                    id="service-instance-editor-cluster-only"
                    className="service-instance-editor__checkbox"
                    type="checkbox"
                    onChange={this.handleToggleClusterOnly}
                  />
                  I want to create an instance also
                </label>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
  }

  renderInstanceFragment(isEditing, fields) {
    return (
      <table className="service-instance-editor__table service-instance-editor__table--scroll">
        <tbody>
          <tr>
            <td className="service-instance-editor__label">Key</td>
            <td className="service-instance-editor__field">
              <TextField
                className="service-instance-editor__input"
                defaultValue={fields.key}
                onChange={this.handleChangeTextField('key')}
                readOnly={isEditing}
              />
            </td>
          </tr>
          <tr>
            <td className="service-instance-editor__label">IP</td>
            <td className="service-instance-editor__field">
              <TextField
                className="service-instance-editor__input"
                defaultValue={fields.ip}
                onChange={this.handleChangeTextField('ip')}
              />
            </td>
          </tr>
          <tr>
            <td className="service-instance-editor__label">Port</td>
            <td className="service-instance-editor__field">
              <KeyValue
                defaultValue={fields.port}
                onChange={this.handleChangeKeyValue('port')}
              />
            </td>
          </tr>
          <tr>
            <td className="service-instance-editor__label">State</td>
            <td className="service-instance-editor__field">
              <StateSwitch
                value={fields.state}
                onValue="up"
                offValue="down"
                onChange={this.handleChangeTextField('state')}
                disabled={!FEATURE_LIST.stateswitch && fields.state === 'up'}
              />
            </td>
          </tr>
          <tr>
            <td className="service-instance-editor__label">Meta</td>
            <td className="service-instance-editor__field">
              <KeyValue
                defaultValue={fields.meta}
                onChange={this.handleChangeKeyValue('meta')}
              />
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  renderActionFragment(isEditing, fields, clusterOnly) {
    let saveText;
    const clusterName = fields.cluster.get('clusterName');
    let isValid = Boolean(clusterName) && !isReservedClusterName(clusterName);

    if (isEditing) {
      saveText = 'Save Instance';
      isValid = isValid && fields.key && fields.ip;
    } else if (clusterOnly) {
      saveText = 'Create Cluster';
    } else {
      saveText = 'Create Instance';
      isValid = isValid && fields.key && fields.ip;
    }

    return (
      <table className="service-instance-editor__table">
        <tbody>
          <tr>
            <td className="service-instance-editor__label" />
            <td className="service-instance-editor__btn-group">
              <Button
                onClick={this.handleClickSubmit}
                disabled={!isValid}
                tip="长按保存"
                type="danger"
                effect="delay"
              >
                {saveText}
              </Button>
              <Button type="default" onClick={this.handleClickCancel}>Cancel</Button>
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  render() {
    const { key, title, isEditing } = this.props;
    const { clusterOnly } = this.state;
    const fields = this.collectForm();
    return (
      <dl key={`service-editor-${key}`} className="service-instance-editor">
        <dt title={title}>
          <span className="service-instance-editor__title">
            {title}
          </span>
        </dt>
        <dd>
          {this.renderClusterFragment(isEditing, fields)}
          {isEditing || !clusterOnly
            ? this.renderInstanceFragment(isEditing, fields) : null}
          {this.renderActionFragment(isEditing, fields, clusterOnly)}
        </dd>
      </dl>
    );
  }
}
