import React from 'react';
import PropTypes from 'prop-types';
import AceEditor from 'react-ace';
import 'brace/mode/json';
import 'brace/theme/tomorrow';
import Button from '../../../components/button';
import TextField from '../../../components/textfield';
import TextArea from '../../../components/textarea';
import AutoComplete from '../../../components/autocomplete';
import { ClusterLabel } from '../../../components/inline';
import Tags from '../../../components/tags';
import dialog from '../../../services/dialog';
import toast from '../../../services/toast';
import { isJSON, isLikeJSON } from '../../../services/utils/text';
import { RESERVED_CLUSTER_NAME, OVERALL_CLUSTER, ENCRYPTION_PREFIX, isReservedConfigKey } from '../../../constants/common';
import { FEATURE_LIST } from '../../../constants/env';
import { Cluster } from '../../../structures';
import { isReservedClusterName } from '../../../components/utils';
import ErrorHint from './hint';
import './editor.sass';

export default class Editor extends React.Component {
  static propTypes = {
    defaultValue: PropTypes.shape({
      cluster: PropTypes.string.isRequired,
      key: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      comment: PropTypes.string,
      tags: PropTypes.arrayOf(PropTypes.string),
    }),
    key: PropTypes.string,
    title: PropTypes.string,
    onSubmit: PropTypes.func,
    candidates: PropTypes.shape({
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
    isAceEditor: null,
    errorHint: {
      content: '',
      suggestion: '',
    },
    isEncrypted: false,
    errorHintHidden: true,
  };

  componentWillReceiveProps(nextProps) {
    const { defaultValue } = nextProps;
    const { isEncrypted } = defaultValue.value.startsWith(ENCRYPTION_PREFIX);
    this.setState({ isEncrypted });
  }

  handleChangeZone = cluster => (event) => {
    const ezone = Cluster.getZone(event.target.value);
    this.setState(state => ({
      value: Object.assign({}, state.value, {
        cluster: cluster.set('ezone', ezone).normalize(),
      }),
    }));
  }

  handleChangeClusterName = cluster => (event, extraProps) => {
    // AutoComplete uses extraProps here
    const clusterName = extraProps.inputValue.trim();
    this.setState(state => ({
      value: Object.assign({}, state.value, {
        cluster: cluster.set('clusterName', clusterName).normalize(),
      }),
    }));
  }

  handleChangeField = (name, then = null) => (event) => {
    const inputValue = event.target ? event.target.value : event;
    const field = { [name]: inputValue };
    this.setState(state => ({
      value: Object.assign({}, state.value, field),
    }));
    if (then) {
      then(inputValue);
    }
  }

  handleToggleOverall = isOverall => () => {
    this.setState({ isOverall });
  }

  handleErrorHint = (value) => {
    const { defaultValue } = this.props;
    const isPreviousValueJSON = defaultValue && isJSON(defaultValue.value);
    const isCurrentValueLikeJSON = isLikeJSON(value);

    if (!isPreviousValueJSON && !isCurrentValueLikeJSON) {
      this.setState({ errorHintHidden: true });
      return;
    }

    try {
      JSON.parse(value);
    } catch (e) {
      let reason = '';
      if (isPreviousValueJSON) {
        reason = ' because the previous value is a valid JSON';
      }
      if (isCurrentValueLikeJSON) {
        reason = ' because the input value is like a JSON';
      }
      const suggestion = `You receive this warning${reason}.`;
      const content = e.toString();
      const errorHint = { suggestion, content };
      this.setState({ errorHint, errorHintHidden: false });
      return;
    }

    this.setState({ errorHintHidden: true });
  }

  handleClickSubmit = async () => {
    const { cluster, key, value, comment, tags, isOverall } = this.collectForm();
    const { onSubmit, isEditing } = this.props;
    const submitValue = {
      cluster: isOverall ? OVERALL_CLUSTER : cluster.toString(),
      key: key.trim(),
      value: value.trim(),
      comment: comment.trim(),
      encrypt: Number(this.state.isEncrypted),
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

  handleClickToggleEditor = isComplexJSON => (event) => {
    event.preventDefault();
    this.setState(({ isAceEditor }) => ({
      isAceEditor: isAceEditor === null ? !isComplexJSON : !isAceEditor,
    }));
  };

  handleClickPrettify = inputValue => (event) => {
    event.preventDefault();

    let prettyInputValue;

    try {
      prettyInputValue = JSON.stringify(JSON.parse(inputValue), null, 2).trim();
    } catch (e) {
      toast(<span>The value is not valid JSON</span>);
      return;
    }

    const field = { value: prettyInputValue };
    this.setState(({ value }) => ({
      value: Object.assign({}, value, field),
    }));
  };

  handleClickEncrypt = () => {
    const { isEncrypted } = this.state;
    this.setState({ isEncrypted: !isEncrypted });
  }

  collectForm = () => {
    const { value, isOverall } = this.state;
    const defaultValue = this.props.defaultValue || {};
    const cluster = Cluster.parse(
      value.cluster === null ? defaultValue.cluster || '' : value.cluster,
    );
    return {
      cluster: cluster.isEmpty
        ? cluster.set('ezone', Cluster.getZoneList()[0]).normalize()
        : cluster,
      key: value.key === null ? defaultValue.key || '' : value.key,
      value: value.value === null ? defaultValue.value || '' : value.value,
      comment: value.comment === null ? defaultValue.comment || '' : value.comment,
      tags: value.tags === null ? defaultValue.tags || [] : value.tags,
      isOverall: isOverall === null
        ? defaultValue.cluster === OVERALL_CLUSTER || !defaultValue.cluster
        : isOverall,
    };
  }

  renderTextArea(value, isComplexJSON) {
    const { isAceEditor } = this.state;

    if (isAceEditor === null ? isComplexJSON : isAceEditor) {
      return (
        <AceEditor
          className="config-editor__ace"
          mode="json"
          theme="tomorrow"
          width="auto"
          height="auto"
          value={value}
          onChange={this.handleChangeField('value', this.handleErrorHint)}
          tabSize={2}
          editorProps={{ $blockScrolling: true }}
          setOptions={{ fixedWidthGutter: true }}
        />
      );
    }

    return (
      <TextArea
        className="config-editor__textarea"
        value={value}
        onChange={this.handleChangeField('value', this.handleErrorHint)}
      />
    );
  }

  renderForm(isEditing) {
    const { cluster, key, value, comment, tags, isOverall } = this.collectForm();
    const { defaultValue } = this.props;
    const { errorHint, errorHintHidden } = this.state;
    const isReservedCluster = (
      !isOverall && isReservedClusterName(cluster.clusterName, false)
    );
    const isReservedKey = isReservedConfigKey(key);
    const isComplexJSON = (
      defaultValue && isJSON(defaultValue.value) && isLikeJSON(defaultValue.value)
    );
    const isValid = (
      key && !isReservedKey && !isReservedCluster && value.trim()
      && (isOverall || cluster.get('clusterName'))
    );

    const clusterNameCandidates = this.props.candidates.clusterName
      .map(i => Cluster.parse(i))
      .filter(i => i.get('ezone') === cluster.get('ezone'))
      .map(i => i.get('clusterName'))
      .filter(i => RESERVED_CLUSTER_NAME.indexOf(i) === -1)
      .map(i => ({ name: i, value: i }));

    return (
      <table className="config-editor__table">
        <tbody>
          <tr>
            <td className="config-editor__label">Tags</td>
            <td className="config-editor__field">
              <Tags
                tags={tags}
                suggestions={this.props.candidates.tagList}
                onChange={this.handleChangeField('tags')}
                readOnly={false}
                uniq
              />
            </td>
          </tr>
          <tr>
            <td className="config-editor__label">Key</td>
            <td className="config-editor__field">
              <TextField
                className="config-editor__input"
                value={key}
                readOnly={isEditing}
                onChange={this.handleChangeField('key')}
              />
              {isReservedKey && (
                <span className="config-editor__field-line-error">
                  Reserved key
                </span>
              )}
            </td>
          </tr>
          {!isEditing && (
            <tr>
              <td className="config-editor__label" />
              <td className="config-editor__field">
                <label htmlFor="config-editor-is-overall">
                  <input
                    id="config-editor-is-overall"
                    type="checkbox"
                    className="config-editor__checkbox"
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
              <td className="config-editor__label">Cluster</td>
              <td className="config-editor__field">
                <ClusterLabel value={isOverall ? OVERALL_CLUSTER : cluster} allowDefault />
              </td>
            </tr>
          ) : null}
          {!isOverall && !isEditing && (
            <tr>
              <td className="config-editor__label" />
              <td className="config-editor__field">
                {cluster.isEmpty
                  ? <span>No Preview</span>
                  : <ClusterLabel value={cluster} />}
                {isReservedCluster && (
                  <span className="config-editor__field-line-error">
                    Reserved cluster name
                  </span>
                )}
              </td>
            </tr>
          )}
          {!isOverall && !isEditing && (
            <tr>
              <td className="config-editor__label">E-Zone</td>
              <td className="config-editor__field">
                <select
                  className="config-editor__input"
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
              <td className="config-editor__label">Cluster</td>
              <td className="config-editor__field">
                <AutoComplete
                  inputClassName="config-editor__input"
                  defaultValue={cluster.get('clusterName')}
                  candidates={clusterNameCandidates}
                  onChange={this.handleChangeClusterName(cluster)}
                />
              </td>
            </tr>
          )}
          <tr>
            <td className="config-editor__label">Value</td>
            <td className="config-editor__field">
              <ErrorHint
                content={errorHint.content}
                suggestion={errorHint.suggestion}
                isHidden={errorHintHidden}
              />
              {this.renderTextArea(value, isComplexJSON)}
              <div className="config-editor__btn-link-line">
                {FEATURE_LIST.configencrypt && (
                  <span className="config-editor__btn-link-line--left">
                    <input
                      name="isEncrypted"
                      type="checkbox"
                      checked={this.state.isEncrypted}
                      onChange={this.handleClickEncrypt}
                    />
                    Encrypt
                  </span>
                )}
                <span className="config-editor__btn-link-line--right">
                  <a
                    className="config-editor__btn-link"
                    href="#toggle-json-editor"
                    onClick={this.handleClickToggleEditor(isComplexJSON)}
                  >
                    Toggle
                  </a>
                  <a
                    className="config-editor__btn-link"
                    href="#json-prettify"
                    onClick={this.handleClickPrettify(value)}
                  >
                    JSON Prettify
                  </a>
                </span>
              </div>
              <div className="config-editor__tip" />
            </td>
          </tr>
          <tr>
            <td className="config-editor__label">Comment</td>
            <td className="config-editor__field">
              <TextArea
                className="config-editor__input"
                value={comment}
                onChange={this.handleChangeField('comment')}
              />
            </td>
          </tr>
          <tr>
            <td className="config-editor__label" />
            <td className="config-editor__btn-group">
              <Button
                onClick={this.handleClickSubmit}
                disabled={!isValid}
                effect={errorHintHidden ? 'default' : 'delay'}
                tip="未通过 JSON 语法校验，如需保存请长按按钮"
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
      <dl key={`config-editor-${key}`} className="config-editor">
        <dt>{title}</dt>
        <dd>
          {this.renderForm(isEditing)}
        </dd>
      </dl>
    );
  }
}
