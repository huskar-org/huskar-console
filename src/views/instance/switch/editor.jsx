import React from 'react';
import PropTypes from 'prop-types';
import Button from '../../../components/button';
import TextArea from '../../../components/textarea';
import Percenter from '../../../components/percenter';
import AutoComplete from '../../../components/autocomplete';
import { ClusterLabel } from '../../../components/inline';
import Tags from '../../../components/tags';
import { RESERVED_CLUSTER_NAME, OVERALL_CLUSTER } from '../../../constants/common';
import dialog from '../../../services/dialog';
import { Cluster } from '../../../structures';
import { isReservedClusterName } from '../../../components/utils';
import './editor.sass';

export default class Editor extends React.Component {
  static propTypes = {
    defaultValue: PropTypes.shape({
      cluster: PropTypes.string.isRequired,
      key: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      comment: PropTypes.string.isRequired,
      tags: PropTypes.arrayOf(PropTypes.string),
    }),
    key: PropTypes.string,
    title: PropTypes.string,
    onSubmit: PropTypes.func,
    candidates: PropTypes.shape({
      key: PropTypes.arrayOf(PropTypes.string).isRequired,
      clusterName: PropTypes.arrayOf(PropTypes.string).isRequired,
      tagList: PropTypes.arrayOf(PropTypes.string).isRequired,
    }),
    isEditing: PropTypes.bool,
  };

  static defaultProps = {
    defaultValue: null,
    key: null,
    title: 'Edit',
    onSubmit: null,
    candidates: {
      key: [],
      clusterName: [],
      tagList: [],
    },
    isEditing: false,
  };

  state = {
    value: {
      cluster: null,
      key: null,
      value: null,
      comment: null,
      tags: null,
    },
    isOverall: null,
  };

  handleChangeZone = cluster => (event) => {
    const ezone = Cluster.getZone(event.target.value);
    this.setState((prevState) => {
      const value = Object.assign({}, prevState.value, {
        cluster: cluster.set('ezone', ezone).normalize(),
      });
      return { value };
    });
  };

  handleChangeClusterName = cluster => (event, extraProps) => {
    const { inputValue } = extraProps;
    this.setState((prevState) => {
      // AutoComplete uses extraProps here
      const value = Object.assign({}, prevState.value, {
        cluster: cluster.set('clusterName', inputValue.trim()).normalize(),
      });
      return { value };
    });
  };

  handleChangeTag = (event) => {
    const inputValue = event.target ? event.target.value : event;
    const field = { tags: inputValue };
    this.setState(({ value }) => ({
      value: Object.assign({}, value, field),
    }));
  };

  handleChangeField = name => (event, extraProps) => {
    // AutoComplete uses extraProps here
    const field = {
      [name]: extraProps ? extraProps.inputValue : event.target.value,
    };
    this.setState(({ value }) => ({
      value: Object.assign({}, value, field),
    }));
  };

  handleToggleOverall = isOverall => () => {
    this.setState({ isOverall });
  };

  handleClickSubmit = () => {
    const { cluster, key, value, comment, tags, isOverall } = this.collectForm();
    const { onSubmit, isEditing } = this.props;
    const submitValue = {
      cluster: isOverall ? OVERALL_CLUSTER : cluster.toString(),
      key: key.trim(),
      value: (+value || 0),
      comment: comment.trim(),
      tags,
    };
    if (!onSubmit) {
      return;
    }
    onSubmit(submitValue, isEditing);
    dialog.then(c => c.close());
  };

  handleClickCancel = () => {
    dialog.then(c => c.close());
  };

  collectForm = () => {
    const { value, isOverall } = this.state;
    const defaultValue = this.props.defaultValue || {};
    const cluster = Cluster.parse(value.cluster === null
      ? defaultValue.cluster || ''
      : value.cluster);
    return {
      cluster: cluster.isEmpty
        ? cluster.set('ezone', Cluster.getZoneList()[0]).normalize()
        : cluster,
      key: value.key === null ? defaultValue.key || '' : value.key,
      value: value.value === null ? defaultValue.value || 0 : value.value,
      comment: value.comment === null ? defaultValue.comment || '' : value.comment,
      tags: value.tags === null ? defaultValue.tags || [] : value.tags,
      isOverall: isOverall === null
        ? defaultValue.cluster === OVERALL_CLUSTER || !defaultValue.cluster
        : isOverall,
    };
  };

  renderForm(isEditing) {
    const { cluster, key, value, comment, tags, isOverall } = this.collectForm();
    const isReservedCluster = (
      !isOverall && isReservedClusterName(cluster.clusterName, false)
    );
    const isValid = (
      key
      && !isReservedCluster
      && (isOverall || cluster.get('clusterName'))
      && value.toString().trim()
    );
    const keyCandidates = this.props.candidates.key.map(i => ({ name: i, value: i }));
    const clusterNameCandidates = this.props.candidates.clusterName
      .map(i => Cluster.parse(i))
      .filter(i => i.get('ezone') === cluster.get('ezone'))
      .map(i => i.get('clusterName'))
      .filter(i => RESERVED_CLUSTER_NAME.indexOf(i) === -1)
      .map(i => ({ name: i, value: i }));
    return (
      <table className="switch-editor__table">
        <tbody>
          <tr>
            <td className="switch-editor__label">Tags</td>
            <td className="switch-editor__field">
              <Tags
                tags={tags}
                suggestions={this.props.candidates.tagList}
                onChange={this.handleChangeTag}
                readOnly={false}
                uniq
              />
            </td>
          </tr>
          <tr>
            <td className="switch-editor__label">Key</td>
            <td className="switch-editor__field">
              <AutoComplete
                inputClassName="switch-editor__input"
                defaultValue={key}
                candidates={keyCandidates}
                readOnly={isEditing}
                onChange={this.handleChangeField('key')}
              />
            </td>
          </tr>
          {!isEditing && (
            <tr>
              <td className="switch-editor__label" />
              <td className="switch-editor__field">
                <label htmlFor="switch-editor-is-overall">
                  <input
                    id="switch-editor-is-overall"
                    type="checkbox"
                    className="switch-editor__checkbox"
                    checked={!isOverall}
                    onChange={this.handleToggleOverall(!isOverall)}
                  />
                  Be specific to a certain cluster
                </label>
              </td>
            </tr>
          )}
          {isOverall || isEditing ? (
            <tr>
              <td className="switch-editor__label">Cluster</td>
              <td className="switch-editor__field">
                <ClusterLabel value={isOverall ? OVERALL_CLUSTER : cluster} allowDefault />
              </td>
            </tr>
          ) : null}
          {!isOverall && !isEditing && (
            <tr>
              <td className="switch-editor__label" />
              <td className="switch-editor__field">
                {cluster.isEmpty
                  ? <span>No Preview</span>
                  : <ClusterLabel value={cluster} />}
                {isReservedCluster && (
                  <span className="switch-editor__field-line-error">
                    Reserved cluster name
                  </span>
                )}
              </td>
            </tr>
          )}
          {!isOverall && !isEditing && (
            <tr>
              <td className="switch-editor__label">E-Zone</td>
              <td className="switch-editor__field">
                <select
                  className="switch-editor__input"
                  value={cluster.get('ezone').name}
                  onChange={this.handleChangeZone(cluster)}
                >
                  {Cluster.getZoneList().map(ezone => (
                    <option value={ezone.name || ''} key={ezone.name || 'global'}>
                      {ezone.name ? `${ezone.name} (${ezone.idc})` : '-'}
                    </option>))}
                </select>
              </td>
            </tr>
          )}
          {!isOverall && !isEditing && (
            <tr>
              <td className="switch-editor__label">Cluster</td>
              <td className="switch-editor__field">
                <AutoComplete
                  inputClassName="switch-editor__input"
                  defaultValue={cluster.get('clusterName')}
                  candidates={clusterNameCandidates}
                  onChange={this.handleChangeClusterName(cluster)}
                />
              </td>
            </tr>
          )}
          <tr>
            <td
              className="switch-editor__label"
            >
              Value
            </td>
            <td className="switch-editor__field">
              <Percenter
                className="switch-editor__input"
                defaultValue={+value || 0}
                onChange={this.handleChangeField('value')}
                max={100}
                min={0}
                step={1}
              />
            </td>
          </tr>
          <tr>
            <td className="switch-editor__label">Comment</td>
            <td className="switch-editor__field">
              <TextArea
                className="switch-editor__input"
                value={comment}
                onChange={this.handleChangeField('comment')}
              />
            </td>
          </tr>
          <tr>
            <td className="switch-editor__label" />
            <td className="switch-editor__btn-group">
              <Button
                onClick={this.handleClickSubmit}
                disabled={!isValid}
                tip="长按保存"
                type="danger"
                effect="delay"
              >
                Save
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

    return (
      <dl key={`switch-editor-${key}`} className="switch-editor">
        <dt>{title}</dt>
        <dd>
          {this.renderForm(isEditing)}
        </dd>
      </dl>
    );
  }
}
