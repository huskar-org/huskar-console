import React from 'react';
import PropTypes from 'prop-types';
import { InfraConfigTypes } from '../../../structures';
import InfraTypeStep from './infra-type-step';
import InfraConfigStep from './infra-config-step';
import ConnectiveResult from './connective';
import './index.sass';

const STEP_TYPE = 'STEP_TYPE';
const STEP_CONFIG = 'STEP_CONFIG';
const STEP_CHECK = 'STEP_CHECK';

export default class InfraConfigEditor extends React.Component {
  static propTypes = {
    applicationName: PropTypes.string.isRequired,
    applicationNameList: PropTypes.arrayOf(PropTypes.string).isRequired,
    defaultValue: PropTypes.shape({
      infraType: PropTypes.oneOf(Object.keys(InfraConfigTypes.types)),
      infraName: PropTypes.string,
      infraProtocol: PropTypes.string,
      scopeType: PropTypes.oneOf(Object.values(InfraConfigTypes.scopes)),
      scopeName: PropTypes.string,
      value: PropTypes.objectOf(PropTypes.string),
      valueUrlMap: PropTypes.objectOf(PropTypes.objectOf(
        PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
      )),
    }),
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    scopeNameList: PropTypes.arrayOf(PropTypes.string).isRequired,
    usedScopeNameList: PropTypes.arrayOf(PropTypes.string),
    isDuplicate: PropTypes.bool,
  };

  static defaultProps = {
    defaultValue: null,
    isDuplicate: false,
    usedScopeNameList: [],
  };

  state = {
    step: null,
    data: null,
    clusterName: '',
  };

  handleContinue = (data) => {
    const step = STEP_CONFIG;
    const { defaultValue, isDuplicate } = this.props;
    const newData = isDuplicate ? Object.assign({}, defaultValue, data) : data;
    this.setState({ step, data: newData });
  }

  handleCancelConfigStep = () => {
    const step = STEP_TYPE;
    this.setState({ step });
  }

  handleSubmit = (data) => {
    this.props.onSubmit(data);
  }

  handleCancelTypeStep = () => {
    this.props.onCancel();
  }

  handleCheck = (valueUrlMap, clusterName) => {
    const step = STEP_CHECK;
    const { data } = this.state;
    this.setState({
      step,
      data: Object.assign(
        {}, data || this.props.defaultValue, { valueUrlMap },
      ),
      clusterName,
    });
  }

  handleCancelCheck = () => {
    const step = STEP_CONFIG;
    this.setState({ step });
  }

  render() {
    const { isDuplicate, scopeNameList, usedScopeNameList } = this.props;
    let { step, data } = this.state;
    let filteredScopeNameList = scopeNameList.concat([]);
    if (!step) {
      if (this.props.defaultValue && !isDuplicate) {
        step = STEP_CONFIG;
        data = this.props.defaultValue;
      } else {
        step = STEP_TYPE;
      }
    }

    if (step === STEP_TYPE) {
      if (isDuplicate) {
        filteredScopeNameList = scopeNameList
          .filter(name => !usedScopeNameList.some(v => name === v));
        if (data) {
          data = Object.assign({}, this.props.defaultValue, data);
        } else {
          data = Object.assign({}, this.props.defaultValue);
          delete data.scopeName;
        }
      }
      return (
        <InfraTypeStep
          defaultValue={data}
          onContinue={this.handleContinue}
          onCancel={this.handleCancelTypeStep}
          scopeNameList={filteredScopeNameList}
          isDuplicate={isDuplicate}
        />
      );
    }

    if (step === STEP_CONFIG) {
      const valueUrlMap = Object.assign({}, data.valueUrlMap);
      const { clusterName } = this.state;
      if (isDuplicate) {
        Object.keys(valueUrlMap).forEach((k) => {
          valueUrlMap[k].clusterName = clusterName;
        });
      }
      return (
        <InfraConfigStep
          applicationNameList={this.props.applicationNameList}
          infraType={data.infraType}
          infraName={data.infraName}
          infraProtocol={data.infraProtocol}
          scopeType={data.scopeType}
          scopeName={data.scopeName}
          value={data.value}
          valueUrlMap={valueUrlMap}
          onSubmit={this.handleSubmit}
          onCheck={this.handleCheck}
          onCancel={this.handleCancelConfigStep}
          scopeNameList={scopeNameList}
          isDuplicate={isDuplicate}
        />
      );
    }

    const { applicationName } = this.props;
    return (
      <ConnectiveResult
        applicationName={applicationName}
        infraType={data.infraType}
        valueUrlMap={data.valueUrlMap}
        onCancel={this.handleCancelCheck}
      />
    );
  }
}
