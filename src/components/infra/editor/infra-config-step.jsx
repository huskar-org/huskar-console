import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import _ from 'lodash';
import TextField from '../../textfield';
import Button from '../../button';
import { FEATURE_LIST } from '../../../constants/env';
import { InfraConfigItem, InfraConfigTypes } from '../../../structures';
import EditorField from './field';
import ClusterCandidateList from './cluster-candidate-list';
import PseudoCode from './pseudo-code';
import validateRawUrl from './utils';

const RW_PATTERN = /(^.+)(\.master$|\.auto$)/;

export default class InfraConfigStep extends React.Component {
  static propTypes = {
    applicationNameList: PropTypes.arrayOf(PropTypes.string).isRequired,
    infraType: PropTypes.oneOf(Object.keys(InfraConfigTypes.types)).isRequired,
    infraName: PropTypes.string.isRequired,
    scopeType: PropTypes.oneOf(Object.values(InfraConfigTypes.scopes)).isRequired,
    scopeName: PropTypes.string.isRequired,
    value: PropTypes.objectOf(PropTypes.string),
    // eslint-disable-next-line react/no-unused-prop-types
    infraProtocol: PropTypes.string,
    // eslint-disable-next-line react/no-unused-prop-types
    valueUrlMap: PropTypes.objectOf(PropTypes.objectOf(
      PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
    )),
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onCheck: PropTypes.func.isRequired,
    scopeNameList: PropTypes.arrayOf(PropTypes.string).isRequired,
    isDuplicate: PropTypes.bool,
    clusterName: PropTypes.string,
  };

  static defaultProps = {
    value: {},
    valueUrlMap: {},
    infraProtocol: null,
    isDuplicate: false,
    clusterName: '',
  };

  constructor(props) {
    super(props);
    this.state = this.makeInfraType(props);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.makeInfraType(nextProps));
  }

  get canSplitReadWrite() {
    return this.infraType.urlAttributes.length > 1;
  }

  makeInfraType = (props) => {
    this.infraType = InfraConfigTypes.findByKey(props.infraType);
    this.urlComponents = _.fromPairs(
      this.infraType.urlComponents.map(v => [v, true]),
    );

    const { value } = props;
    let { infraProtocol } = props;
    let bindMaster = false;
    let valueUrlMap = props.valueUrlMap[this.infraType.urlAttributes[0]];
    let rawUrl = '';
    let useRawUrl = false;
    if (this.canSplitReadWrite && valueUrlMap) {
      const { applicationName } = valueUrlMap;
      const match = RW_PATTERN.exec(applicationName);
      bindMaster = this.infraType.urlAttributes
        .every(name => (
          props.valueUrlMap[name].applicationName.endsWith('.master')
        ));
      ({ infraProtocol } = valueUrlMap);
      valueUrlMap = Object.assign({}, valueUrlMap, {
        infraProtocol,
        applicationName: (match ? `${match[1]}.auto` : applicationName),
      });
    }
    if (!infraProtocol && valueUrlMap) {
      ({ infraProtocol } = valueUrlMap);
    }
    if (!valueUrlMap) {
      valueUrlMap = { infraProtocol };
    } else if (valueUrlMap.isRawUrl) {
      useRawUrl = true;
      rawUrl = valueUrlMap.url;
    }
    return { value, valueUrlMap, infraProtocol, bindMaster, useRawUrl, rawUrl };
  }

  makeValueUrlMap = (urlAttribute) => {
    const { valueUrlMap, bindMaster, useRawUrl, rawUrl } = this.state;
    if (useRawUrl) {
      return [urlAttribute, rawUrl];
    }

    const { urlBuilder } = this.infraType;
    if (!this.canSplitReadWrite) {
      return [urlAttribute, urlBuilder(valueUrlMap)];
    }

    const { applicationName } = valueUrlMap;
    const match = RW_PATTERN.exec(applicationName);
    const applicationNameMap = {
      master: match && `${match[1]}.master`,
      slave: match && `${match[1]}.auto`,
    };
    const finalApplicationName = bindMaster
      ? (applicationNameMap.master || applicationName)
      : (applicationNameMap[urlAttribute] || applicationName);
    const finalValueUrlMap = Object.assign({}, valueUrlMap, {
      applicationName: finalApplicationName,
    });
    return [urlAttribute, urlBuilder(finalValueUrlMap)];
  }

  handleClickSubmit = () => {
    const { infraType, infraName, scopeType, scopeName } = this.props;
    const { infraProtocol } = this.state;
    const { urlAttributes } = this.infraType;
    const partialValue = _.fromPairs(urlAttributes.map(this.makeValueUrlMap));
    const value = Object.assign({}, this.state.value, partialValue);
    this.props.onSubmit({
      infraType,
      infraName,
      infraProtocol,
      scopeType,
      scopeName,
      value,
    });
  }

  handleClickCancel = () => {
    this.props.onCancel();
  }

  handleClickCheck = () => {
    const { infraType, infraName, scopeType, scopeName } = this.props;
    const { urlAttributes } = this.infraType;
    const partialValue = _.fromPairs(urlAttributes.map(this.makeValueUrlMap));
    const value = Object.assign({}, this.state.value, partialValue);
    const item = new InfraConfigItem(
      scopeType, scopeName, infraType, infraName, value,
    );
    const { clusterName } = this.state.valueUrlMap;
    this.props.onCheck(item.getUrlMap(), clusterName);
  }

  handleChangeUrl = (valueUrlMap, valueKey, isSelected = false) => (event) => {
    const { value } = isSelected ? (event || { value: '' }) : event.target;
    const newValueUrlMap = Object.assign({}, valueUrlMap, {
      [valueKey]: value.trim(),
    });
    this.setState({ valueUrlMap: newValueUrlMap });
  }

  handleToggleRawUrl = (event) => {
    event.preventDefault();
    const { useRawUrl } = this.state;
    this.setState({ useRawUrl: !useRawUrl });
  }

  handleChangeRawUrl = (event) => {
    this.setState({ rawUrl: event.target.value });
  }

  handleToggleBindMaster = bindMaster => () => {
    this.setState({ bindMaster: !bindMaster });
  }

  renderApplicationList = (valueUrlMap) => {
    const { canSplitReadWrite } = this;
    const { pattern, applicationNameFilter } = this.infraType;
    const applicationNameList = applicationNameFilter(
      this.props.applicationNameList
        .filter(value => pattern.exec(value))
        .filter(value => !canSplitReadWrite || value.endsWith('.auto'))
        .map(value => (canSplitReadWrite
          ? { label: value.slice(0, -('.auto'.length)), value }
          : { label: value, value }
        )),
      this.props.scopeName,
    );

    return (
      <Select
        className="infra-config-editor__select"
        placeholder="Choose an application"
        value={valueUrlMap.applicationName || ''}
        onChange={this.handleChangeUrl(valueUrlMap, 'applicationName', true)}
        options={applicationNameList}
        clearable={false}
      />
    );
  }

  render() {
    const { infraType, urlComponents } = this;
    const { infraName, value, scopeName, scopeNameList, isDuplicate, clusterName } = this.props;
    const { valueUrlMap, bindMaster, infraProtocol, useRawUrl, rawUrl } = this.state;
    const { isRawUrl } = valueUrlMap;
    const isEditing = Object.keys(value).length > 0;
    const isReady = (useRawUrl && validateRawUrl(infraProtocol, rawUrl))
      || (!useRawUrl && infraType.urlComponents.every(key => valueUrlMap[key]));
    const infraProtocolDetail = InfraConfigTypes.protocols[this.props.infraType][infraProtocol];
    const allowRawUrl = infraProtocolDetail.rawUrlExample !== null;
    let message = null;
    if (useRawUrl) {
      message = '不使用直连 URL';
    } else if (FEATURE_LIST.infrarawurl) {
      message = '使用直连 URL';
    }
    return (
      <div className="infra-config-editor">
        {(isEditing && !isDuplicate) ? (
          <h3 className="infra-config-editor__title">
            Edit infra location on {scopeName}
          </h3>
        ) : (
          <h3 className="infra-config-editor__title">
            Step 2 - Choose infra location and config
          </h3>
        )}

        <PseudoCode
          infraProtocol={infraProtocol}
          infraType={this.props.infraType}
          infraName={infraName}
        />

        {allowRawUrl && (isRawUrl || !isEditing) ? (
          <div className="infra-config-editor__toggle-raw-url">
            <a href="#toggle-raw-url" onClick={this.handleToggleRawUrl}>
              {message}
            </a>
          </div>
        ) : null}

        {allowRawUrl && useRawUrl ? (
          <div className="infra-config-editor__body">
            <EditorField label="直连 URL">
              <TextField
                className="infra-config-editor__input-wrapper"
                value={rawUrl}
                onChange={this.handleChangeRawUrl}
              />
            </EditorField>
            <div className="infra-config-editor__field infra-config-editor__comment">
              <div className="infra-config-editor__comment-body">
                <div className="infra-config-editor__comment-item">
                  <div>URL 格式：</div>
                  <code>{infraProtocolDetail.rawUrlFormat}</code>
                </div>
                <div className="infra-config-editor__comment-item">
                  <div>示例：</div>
                  <code>{infraProtocolDetail.rawUrlExample}</code>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="infra-config-editor__body">
            <EditorField label={infraType.providerName}>
              {this.canSplitReadWrite && (
                <div>
                  <label htmlFor="bind-master">
                    <input
                      id="bind-master"
                      type="checkbox"
                      checked={bindMaster}
                      onChange={this.handleToggleBindMaster(bindMaster)}
                    />
                    绑定主库 (不使用读写分离)
                  </label>
                </div>
              )}
              {this.renderApplicationList(valueUrlMap)}
            </EditorField>
            <EditorField label={`${infraType.providerName} Cluster`}>
              <ClusterCandidateList
                className="infra-config-editor__select"
                applicationName={valueUrlMap.applicationName}
                scopeName={scopeName}
                value={valueUrlMap.clusterName || clusterName || ''}
                scopeNameList={scopeNameList}
                onChange={this.handleChangeUrl(valueUrlMap, 'clusterName', true)}
              />
            </EditorField>
            {urlComponents.username && (
              <EditorField label="User">
                <TextField
                  className="infra-config-editor__input"
                  value={valueUrlMap.username || ''}
                  onChange={this.handleChangeUrl(valueUrlMap, 'username')}
                />
              </EditorField>
            )}
            {urlComponents.password && (
              <EditorField label="Password">
                <TextField
                  className="infra-config-editor__input"
                  type="password"
                  autoComplete="new-password"
                  value={valueUrlMap.password || ''}
                  onChange={this.handleChangeUrl(valueUrlMap, 'password')}
                />
              </EditorField>
            )}
            {urlComponents.accessID !== undefined && (
              <EditorField label="AccessID">
                <TextField
                  className="infra-config-editor__input"
                  value={valueUrlMap.accessID || ''}
                  onChange={this.handleChangeUrl(valueUrlMap, 'accessID')}
                />
              </EditorField>
            )}
            {urlComponents.secretKey !== undefined && (
              <EditorField label="SecretKey">
                <TextField
                  className="infra-config-editor__input"
                  type="password"
                  autoComplete="new-password"
                  value={valueUrlMap.secretKey || ''}
                  onChange={this.handleChangeUrl(valueUrlMap, 'secretKey')}
                />
              </EditorField>
            )}
            {urlComponents.dbName && (
              <EditorField label="Database">
                <TextField
                  className="infra-config-editor__input"
                  placeholder="DAL Group"
                  value={valueUrlMap.dbName || ''}
                  onChange={this.handleChangeUrl(valueUrlMap, 'dbName')}
                />
              </EditorField>
            )}
            {urlComponents.vHost && (
              <EditorField label="Virtual Host">
                <TextField
                  className="infra-config-editor__input"
                  placeholder="Virtual Host"
                  value={valueUrlMap.vHost || ''}
                  onChange={this.handleChangeUrl(valueUrlMap, 'vHost')}
                />
              </EditorField>
            )}
          </div>
        )}

        <div className="infra-config-editor__button-group">
          {(!isEditing || isDuplicate) && (
            <Button
              className="infra-config-editor__button"
              onClick={this.handleClickCancel}
              type="default"
            >
              上一步
            </Button>
          )}
          <Button
            className="infra-config-editor__button"
            onClick={this.handleClickCheck}
            disabled={!isReady}
          >
            测试连接
          </Button>
          <Button
            className="infra-config-editor__button"
            onClick={this.handleClickSubmit}
            disabled={(useRawUrl && !FEATURE_LIST.infrarawurl) || !isReady}
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
