import React from 'react';
import PropTypes from 'prop-types';
import { InfraConfigTypes } from '../../../structures';
import InfraTypeStep from './infra-type-step';
import './index.sass';

export default class InfraNameEditor extends React.Component {
  static propTypes = {
    oldValue: PropTypes.shape({
      infraType: PropTypes.oneOf(Object.keys(InfraConfigTypes.types)).isRequired,
      infraName: PropTypes.string.isRequired,
      infraProtocol: PropTypes.string.isRequired,
      scopeType: PropTypes.oneOf(Object.values(InfraConfigTypes.scopes)).isRequired,
      scopeName: PropTypes.string.isRequired,
      value: PropTypes.objectOf(PropTypes.string),
    }).isRequired,
    scopeNameList: PropTypes.arrayOf(PropTypes.string).isRequired,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
  };

  handleSubmit = (data) => {
    const { oldValue } = this.props;
    const newValue = Object.assign({}, oldValue, data);
    this.props.onSubmit(oldValue, newValue);
  };

  handleCancel = () => {
    this.props.onCancel();
  };

  render() {
    const { scopeNameList } = this.props;
    return (
      <InfraTypeStep
        defaultValue={this.props.oldValue}
        onContinue={this.handleSubmit}
        onCancel={this.handleCancel}
        title="修改 Code Name"
        continueText="确认"
        scopeNameList={scopeNameList}
        isEditing
      />
    );
  }
}
