import React from 'react';
import PropTypes from 'prop-types';
import { InfraConfigTypes } from '../../../structures';
import Button from '../../button';
import TextField from '../../textfield';
import StateSwitch from '../../stateswitch';
import EditorField from './field';
import './index.sass';

export default class InfraOptionsEditor extends React.Component {
  static propTypes = {
    richInfraType: PropTypes.oneOf(Object.values(InfraConfigTypes.types)).isRequired,
    value: PropTypes.objectOf(
      PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
    ).isRequired,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    const { value } = this.props;
    this.state = { value };
  }

  handleSubmit = () => {
    const { value } = this.state;
    const { richInfraType } = this.props;
    richInfraType.options.forEach((opt) => {
      const { key } = opt;
      const v = opt.toStr(value[key]);
      if (!v) {
        delete value[key];
      } else {
        value[key] = opt.toJS(v);
      }
    });
    this.props.onSubmit(value);
  };

  handleCancel = () => {
    this.props.onCancel();
  };

  handleChangeOption = (valueMap, key, isSelected = false) => (event) => {
    const { value } = isSelected ? (event || { value: '' }) : event.target;
    const newValueMap = Object.assign({}, valueMap, {
      [key]: value.trim(),
    });
    this.setState({ value: newValueMap });
  };

  checkOptions = (valueMap, optionFields) => (
    optionFields.find((field) => {
      const { key } = field;
      const value = field.toStr(valueMap[key]);
      return !field.validate(value);
    }) === undefined
  );

  renderOptionFields = (valueMap, optionFields) => (
    optionFields.map((field) => {
      const value = field.toStr(valueMap[field.key]);
      return (
        <div key={field.key} className="infra-config-options-editor__group">
          <EditorField label={field.label} key={field.key}>
            {field.inputType === 'boolean' ? (
              <StateSwitch
                value={value || field.defaultValue}
                onValue="true"
                offValue="false"
                onChange={this.handleChangeOption(valueMap, field.key)}
              />
            ) : (
              <TextField
                className="infra-config-editor__input"
                placeholder={field.defaultValue || field.label}
                value={value}
                type={field.inputType}
                onChange={this.handleChangeOption(valueMap, field.key)}
              />
            )}
          </EditorField>
          <div className="infra-config-editor__note">
            {field.notes.helps && field.notes.helps.map(msg => (
              <div key={`note-help-${msg}`} className="infra-config-editor__note--help">
                {msg}
              </div>
            ))}
            {field.notes.warnings && field.notes.warnings.map(msg => (
              <div key={`note-help-${msg}`} className="infra-config-editor__note--warning">
                {msg}
              </div>
            ))}
          </div>
        </div>
      );
    }));

  render() {
    const { richInfraType } = this.props;
    const { value } = this.state;
    const isCompleted = this.checkOptions(value, richInfraType.options);
    const detailLink = richInfraType.optionsDetailLink;
    return (
      <div className="infra-config-editor infra-config-options-editor">
        <h3 className="infra-config-editor__title">
          编辑可选参数
        </h3>
        {this.renderOptionFields(value, richInfraType.options)}
        {detailLink && (
          <div className="infra-config-options-editor__detail">
            各参数的详细解释见
            <a target="_blank" rel="noopener noreferrer" href={detailLink}>Wiki</a>
          </div>
        )}
        <div className="infra-config-editor__button-group">
          <Button
            className="infra-config-editor__button"
            onClick={this.handleCancel}
            type="default"
          >
            取消
          </Button>
          <Button
            className="infra-config-editor__button"
            onClick={this.handleSubmit}
            disabled={!isCompleted}
            type="danger"
            effect="delay"
          >
            保存
          </Button>
        </div>
      </div>
    );
  }
}
