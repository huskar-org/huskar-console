import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import TextField from '../../textfield';
import Button from '../../button';
import { Cluster, InfraConfigTypes } from '../../../structures';
import EditorField from './field';
import PseudoCode from './pseudo-code';

const SCOPE_LABEL = {
  [InfraConfigTypes.scopes.IDC_SCOPE]: 'IDC',
  [InfraConfigTypes.scopes.CLUSTER_SCOPE]: 'Cluster',
};

export default class InfraTypeStep extends React.Component {
  static propTypes = {
    defaultValue: PropTypes.shape({
      infraType: PropTypes.oneOf(Object.keys(InfraConfigTypes.types)).isRequired,
      infraName: PropTypes.string.isRequired,
      infraProtocol: PropTypes.string.isRequired,
      scopeType: PropTypes.oneOf(Object.values(InfraConfigTypes.scopes)).isRequired,
      scopeName: PropTypes.string.isRequired,
    }),
    scopeNameList: PropTypes.arrayOf(PropTypes.string).isRequired,
    onContinue: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    isDuplicate: PropTypes.bool,
    isEditing: PropTypes.bool,
    title: PropTypes.string,
    cancelText: PropTypes.string,
    continueText: PropTypes.string,
  };

  static defaultProps = {
    defaultValue: {},
    isEditing: false,
    isDuplicate: false,
    title: 'Step 1 - Choose infra type and code name',
    cancelText: '取消',
    continueText: '继续',
  };

  constructor(props) {
    super(props);
    const { scopeNameList } = props;
    this.state = Object.assign({
      infraType: 'FX_DATABASE_SETTINGS',
      infraName: '',
      infraProtocol: 'mysql',
      scopeType: InfraConfigTypes.scopes.IDC_SCOPE,
      scopeName: scopeNameList.length > 0 ? scopeNameList[0] : '',
    }, this.props.defaultValue);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(nextProps.defaultValue);
  }

  handleClickContinue = () => {
    const { infraType, infraName, infraProtocol, scopeType, scopeName } = this.state;
    this.props.onContinue({ infraType, infraName, infraProtocol, scopeType, scopeName });
  }

  handleClickCancel = () => {
    this.props.onCancel();
  }

  handleChangeInfraType = (event) => {
    const { value } = event.target;
    const [infraType, infraProtocol] = value.split('#');
    this.setState({ infraType, infraProtocol });
  }

  handleChangeInfraName = (event) => {
    const { value } = event.target;
    this.setState({ infraName: value.trim() });
  }

  handleToggleScopeType = (scopeType, scopeName) => (event) => {
    if (event.altKey && event.shiftKey) {
      this.setState({ scopeType, scopeName });
    }
  }

  handleChangeScopeName = (event) => {
    const { value } = event.target;
    this.setState({ scopeName: value.trim() });
  }

  renderInfraType(infraType, infraProtocol) {
    const { types } = InfraConfigTypes;
    const { isDuplicate } = this.props;
    return (
      <select
        className="infra-config-editor__input"
        value={`${infraType}#${infraProtocol}`}
        onChange={this.handleChangeInfraType}
        disabled={isDuplicate}
      >
        {_.toPairs(types).map(([key, type]) => type.protocols.map(proto => (
          <option value={`${key}#${proto}`} key={`${key}#${proto}`}>
            {type.label} - {InfraConfigTypes.protocols[key][proto].label}
          </option>
        )))}
      </select>
    );
  }

  renderInfraName(infraName) {
    const { isDuplicate } = this.props;
    return (
      <TextField
        className="infra-config-editor__input"
        value={infraName}
        disabled={isDuplicate}
        onChange={this.handleChangeInfraName}
      />
    );
  }

  renderScopeName(scopeType, scopeName) {
    const { scopeNameList } = this.props;
    if (scopeType === InfraConfigTypes.scopes.CLUSTER_SCOPE) {
      return (
        <TextField
          className="infra-config-editor__input"
          value={scopeName}
          onClick={this.handleToggleScopeType(
            InfraConfigTypes.scopes.IDC_SCOPE,
            scopeNameList.length > 0 ? scopeNameList[0] : '',
          )}
          onChange={this.handleChangeScopeName}
        />
      );
    }
    return (
      <select
        className="infra-config-editor__input"
        value={scopeName}
        onClick={this.handleToggleScopeType(
          InfraConfigTypes.scopes.CLUSTER_SCOPE,
          '',
        )}
        onChange={this.handleChangeScopeName}
      >
        {scopeNameList.map(name => (
          <option value={name} key={name}>
            {name} ({(Cluster.getZone(name) || Cluster.getZone()).idc})
          </option>
        ))}
      </select>
    );
  }

  render() {
    const { title, cancelText, continueText, isEditing } = this.props;
    const {
      infraType,
      infraName,
      infraProtocol,
      scopeType,
      scopeName,
    } = this.state;
    const isCompleted = (
      infraType
      && infraName
      && infraProtocol
      && scopeType
      && scopeName);
    return (
      <div className="infra-config-editor">
        <h3 className="infra-config-editor__title">
          {title}
        </h3>

        <PseudoCode
          infraProtocol={infraProtocol}
          infraType={infraType}
          infraName={infraName}
        />

        {!isEditing && (
        <div>
          <EditorField label="Type">
            {this.renderInfraType(infraType, infraProtocol)}
          </EditorField>
          <EditorField label={`Scope (${SCOPE_LABEL[scopeType]})`}>
            {this.renderScopeName(scopeType, scopeName)}
          </EditorField>
        </div>
        )}
        <EditorField label="Code Name">
          {this.renderInfraName(infraName)}
        </EditorField>

        <div className="infra-config-editor__button-group">
          <Button
            className="infra-config-editor__button"
            onClick={this.handleClickCancel}
            type="default"
          >
            {cancelText}
          </Button>
          <Button
            className="infra-config-editor__button"
            onClick={this.handleClickContinue}
            disabled={!isCompleted}
          >
            {continueText}
          </Button>
        </div>
      </div>
    );
  }
}
