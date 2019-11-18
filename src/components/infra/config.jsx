import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import Octicon from 'react-octicon';
import { connect } from 'react-redux';
import _ from 'lodash';
import Table from '../table';
import Button from '../button';
import DialogConfirm from '../dialog/confirm';
import { ApplicationLabel, ZoneLabel, ClusterLabel, InfraTypeLabel } from '../inline';
import dialog from '../../services/dialog';
import { InfraConfigItem, InfraConfigTypes, WellKnownData } from '../../structures';
import * as actions from '../../actions';
import * as schemas from '../../constants/schemas';
import * as hrefs from '../../constants/hrefs';
import { INFRA_TYPE_DISPLAY_ORDER } from '../../constants/infra-common';
import InfraConfigEditor from './editor';
import InfraNameEditor from './editor/infra-name-editor';
import InfraOptionsEditor from './editor/infra-options-editor';
import InfraConfigTutorial from './tutorial';
import { AmqpDashboard, ElasticsearchDashboard } from './third-party';
import './config.sass';

class InfraConfig extends React.Component {
  static propTypes = {
    applicationNameList: PropTypes.arrayOf(PropTypes.string).isRequired,
    applicationName: PropTypes.string.isRequired,
    data: InfraConfigTypes.createPropTypes(PropTypes),
    anchor: PropTypes.shape({
      infraType: PropTypes.string,
      infraName: PropTypes.string,
    }),
    loading: PropTypes.bool,
    isEditable: PropTypes.bool,
    changing: PropTypes.bool.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onRenameInfraName: PropTypes.func.isRequired,
    onChange: PropTypes.func,
    onClearAnchor: PropTypes.func,
    version: PropTypes.number.isRequired,
    wellKnownData: PropTypes.instanceOf(WellKnownData).isRequired,
  };

  static defaultProps = {
    data: {},
    anchor: {},
    loading: false,
    isEditable: true,
    onChange: () => null,
    onClearAnchor: () => null,
  };

  state = {
    collapsedWhenAnchored: true,
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.version < nextProps.version) {
      this.props.onChange();
    }
  }

  componentDidUpdate() {
    if (this.arrowDOM) {
      // We don't have choice to avoid from using findDOMNode since the
      // browsers have a bug (https://bugs.webkit.org/show_bug.cgi?id=83490).
      //
      // eslint-disable-next-line react/no-find-dom-node
      const arrowDOM = ReactDOM.findDOMNode(this.arrowDOM);
      if (arrowDOM && window.location.hash === '#infra-config') {
        arrowDOM.scrollIntoView();
      }
    }
  }

  getScopeNameList = (wellKnownData) => {
    const idcList = wellKnownData.getIDCList();
    const ezoneList = wellKnownData.getEzoneList();
    const excludedIDCList = ezoneList.map((ezone) => {
      const match = /^([a-z]+)\d*$/.exec(ezone);
      return match ? match[1] : '';
    });
    return ezoneList.concat(idcList.filter(idc => !excludedIDCList.includes(idc)));
  }

  handleClickRefresh = () => {
    this.props.onChange();
  }

  handleSubmit = item => (data) => {
    if (this.props.changing) {
      return;
    }
    const { applicationName } = this.props;
    const { infraType, infraName, scopeType, scopeName } = item || data;
    const value = Object.assign({}, item ? item.value : {}, data.value);
    const richInfraType = InfraConfigTypes.findByKey(infraType);
    this.props.onSubmit(
      applicationName, richInfraType, infraName, scopeType, scopeName, value,
    );
    this.handleCancel();
  }

  handleDelete = item => () => {
    if (this.props.changing) {
      return;
    }
    this.props.onDelete(
      this.props.applicationName,
      item.richInfraType,
      item.infraName,
      item.scopeType,
      item.scopeName,
    );
    this.handleCancel();
  }

  handleCancel = () => {
    dialog.then(c => c.close());
  }

  handleClickDelete = item => () => {
    const description = (
      `delete ${item.richInfraType.label} "${item.infraName}" on "${item.scopeName}"`);
    const additionalDescription = (
      item.richInfraType.urlComponents.indexOf('password') > 0
        ? 'Your password in this config will be lost.' : '');
    dialog.then(c => c.popup((
      <DialogConfirm
        onYes={this.handleDelete(item)}
        onNo={this.handleCancel}
        description={description}
        additionalDescription={additionalDescription}
      />
    )));
  }

  handleClickEdit = item => () => {
    const defaultValue = {
      infraType: item.infraType,
      infraName: item.infraName,
      scopeType: item.scopeType,
      scopeName: item.scopeName,
      value: item.value,
      valueUrlMap: item.getUrlMap(),
    };
    const { wellKnownData } = this.props;
    const scopeNameList = this.getScopeNameList(wellKnownData);
    dialog.then(c => c.popup((
      <InfraConfigEditor
        applicationName={this.props.applicationName}
        applicationNameList={this.props.applicationNameList}
        defaultValue={defaultValue}
        scopeNameList={scopeNameList}
        onSubmit={this.handleSubmit(item)}
        onCancel={this.handleCancel}
      />
    )));
  }

  handleClickDuplicate = (item, itemList) => () => {
    const defaultValue = {
      infraType: item.infraType,
      infraName: item.infraName,
      infraProtocol: Object.values(item.getUrlMap())[0].infraProtocol,
      scopeType: item.scopeType,
      scopeName: item.scopeName,
      value: item.value,
      valueUrlMap: item.getUrlMap(),
    };
    const { wellKnownData } = this.props;
    const scopeNameList = this.getScopeNameList(wellKnownData);
    dialog.then(c => c.popup((
      <InfraConfigEditor
        applicationName={this.props.applicationName}
        applicationNameList={this.props.applicationNameList}
        defaultValue={defaultValue}
        scopeNameList={scopeNameList}
        usedScopeNameList={itemList.map(x => x.scopeName)}
        isDuplicate
        onSubmit={this.handleSubmit()}
        onCancel={this.handleCancel}
      />
    )));
  }

  handleClickTutorial = item => () => {
    const { applicationName, wellKnownData } = this.props;
    dialog.then(c => c.popup((
      <InfraConfigTutorial
        applicationName={applicationName}
        infraType={item.infraType}
        infraName={item.infraName}
        valueUrlMap={item.getUrlMap()}
        wellKnownData={wellKnownData}
      />
    )));
  }

  handleClickBind = () => {
    const { applicationName, applicationNameList, wellKnownData } = this.props;
    const scopeNameList = this.getScopeNameList(wellKnownData);
    dialog.then(c => c.popup((
      <InfraConfigEditor
        applicationName={applicationName}
        applicationNameList={applicationNameList}
        scopeNameList={scopeNameList}
        onSubmit={this.handleSubmit()}
        onCancel={this.handleCancel}
      />
    )));
  }

  handleClickExpand = (event) => {
    event.preventDefault();
    const { collapsedWhenAnchored } = this.state;
    this.setState({ collapsedWhenAnchored: !collapsedWhenAnchored });
  }

  handleBindArrowDOM = (c) => {
    this.arrowDOM = c;
  };

  handleClickRenameInfraName = items => (e) => {
    e.preventDefault();
    const { wellKnownData } = this.props;
    const scopeNameList = this.getScopeNameList(wellKnownData);
    const item = items[0];
    const oldValue = {
      infraType: item.infraType,
      infraName: item.infraName,
      infraProtocol: Object.values(item.getUrlMap())[0].infraProtocol,
      scopeType: item.scopeType,
      scopeName: item.scopeName,
      value: item.value,
    };
    dialog.then(c => c.popup((
      <InfraNameEditor
        oldValue={oldValue}
        scopeNameList={scopeNameList}
        onSubmit={this.handleRenameInfraName(items)}
        onCancel={this.handleCancel}
      />
    )));
  };

  handleRenameInfraName = items => (oldValue, newValue) => {
    const { onRenameInfraName, onClearAnchor, applicationName } = this.props;
    const { infraName: oldName } = oldValue;
    const { infraName: newName } = newValue;
    if (newName !== oldName) {
      const infraType = InfraConfigTypes.findByKey(oldValue.infraType).codeName;
      const oldPayloads = items.map(item => Object.assign(
        {}, item, { infraType },
      ));
      const newPayloads = items.map(item => Object.assign(
        {}, item, { infraType, infraName: newName },
      ));
      onRenameInfraName(applicationName, oldPayloads, newPayloads);
    }
    this.handleCancel();
    onClearAnchor();
  };

  handleClickEditorInfraOptions = item => () => {
    const richInfraType = InfraConfigTypes.findByKey(item.infraType);
    dialog.then(c => c.popup((
      <InfraOptionsEditor
        richInfraType={richInfraType}
        value={item.value}
        onSubmit={this.handleEditInfraOptions(item)}
        onCancel={this.handleCancel}
      />
    )));
  };

  handleEditInfraOptions = item => (value) => {
    if (this.props.changing) {
      return;
    }
    const { applicationName } = this.props;
    const { infraType, infraName, scopeType, scopeName } = item;
    const richInfraType = InfraConfigTypes.findByKey(infraType);
    this.props.onSubmit(
      applicationName, richInfraType, infraName, scopeType, scopeName, value,
    );
    this.handleCancel();
  };

  handleChooseDashboard = (item) => {
    if (item.infraType === 'FX_AMQP_SETTINGS') {
      return AmqpDashboard;
    }
    if (item.infraType === 'FX_ES_SETTINGS') {
      return ElasticsearchDashboard;
    }
    return null;
  };

  handleClickDashboard = item => () => {
    const Dashboard = this.handleChooseDashboard(item);
    if (!Dashboard) {
      return;
    }
    dialog.then(c => c.popup((
      <Dashboard
        value={item}
        onCancel={this.handleCancel}
      />
    )));
  }

  isAnchored = () => (
    this.props.anchor && Object.keys(this.props.anchor).length > 0
  );

  renderItemUrl = ([name, { applicationName, clusterName, isRawUrl, url }]) => (
    <div key={name} className="infra-config__location">
      {isRawUrl ? (
        <code className="infra-config__raw-url">
          <i className="infra-config__raw-url-icon" />
          {url.split('://').slice(1).join('')}
        </code>
      ) : (
        <ApplicationLabel value={applicationName}>
          <ClusterLabel value={clusterName} />
        </ApplicationLabel>
      )}
    </div>
  )

  renderItem = size => (item, idx, items) => {
    const { anchor, changing, isEditable, wellKnownData } = this.props;
    const scopeNameList = this.getScopeNameList(wellKnownData);
    const { collapsedWhenAnchored } = this.state;
    const isFirst = idx === 0;
    const isAnchorMatch = this.isAnchored() && item.matchAnchor(anchor);
    const isRenamePinned = isAnchorMatch && collapsedWhenAnchored;
    const { infraType, infraProtocol, richInfraType } = item;
    return (
      <tr key={item.uniqueKey} className={`infra-config__tr${isAnchorMatch ? ' infra-config__tr--anchor' : ''}`}>
        {isFirst && (
          <td className="infra-config-cell" rowSpan={size}>
            <InfraTypeLabel value={infraType} protocol={infraProtocol} />
          </td>
        )}
        {isFirst && (
          <td rowSpan={size} className="infra-config-cell" title="The code reference name">
            <code className="infra-config__codename">{item.infraName}</code>
            <a
              className={`infra-config-cell__button${isRenamePinned ? ' infra-config-cell__button--pinned' : ''}`}
              title="修改 Code Name, 修改时请注意保持各环境一致"
              href="#rename-code-name"
              onClick={this.handleClickRenameInfraName(items)}
            >
              {isRenamePinned
                ? <span>重命名</span>
                : <span className="octicon octicon-pencil" />}
            </a>
          </td>
        )}
        <td>
          {item.isClusterScope
            ? <ClusterLabel value={item.scopeName} />
            : <ZoneLabel value={item.scopeName} allowUndeclared />}
        </td>
        <td>
          {_.toPairs(item.getUrlMap()).map(this.renderItemUrl)}
        </td>
        <td>
          <Button
            className="infra-config__button"
            disabled={changing}
            title="查看使用方法"
            onClick={this.handleClickTutorial(item)}
          >
            <Octicon name="rocket" />
            <span className="infra-config__button-text">How to Use</span>
          </Button>
          <Button
            className="infra-config__button"
            disabled={changing || !isEditable}
            title="修改资源解析"
            onClick={this.handleClickEdit(item)}
            type="default"
          >
            <Octicon name="pencil" />
          </Button>
          {scopeNameList.filter(name => !items.some(x => x.scopeName === name)).length > 0 && (
            <Button
              title="快速创建相同 code name 的其他 ezone 配置"
              className="infra-config__button"
              onClick={this.handleClickDuplicate(item, items)}
              disabled={changing || !isEditable}
              type="default"
            >
              <Octicon name="repo-forked" />
            </Button>
          )}
          {richInfraType.options.length > 0 && (
            <Button
              className="infra-config__button"
              disabled={changing || !isEditable}
              title="修改连接参数 (客户端)"
              onClick={this.handleClickEditorInfraOptions(item)}
              type="default"
            >
              <i className="infra-config__option-btn-icon" />
            </Button>
          )}
          {this.handleChooseDashboard(item) && (
            <Button
              className="infra-config__button"
              disabled={changing || !isEditable}
              title="前往仪表盘"
              onClick={this.handleClickDashboard(item)}
              type="default"
            >
              <i className="infra-config__dashboard-btn-icon" />
            </Button>
          )}
          <Button
            className="infra-config__button"
            disabled={changing || !isEditable}
            onClick={this.handleClickDelete(item)}
            title="解绑资源"
            type="default"
          >
            <Octicon name="trashcan" />
          </Button>
        </td>
      </tr>
    );
  }

  renderGroup = (items) => {
    const size = items.length;
    return _.sortBy(items, 'scopeName').map(this.renderItem(size));
  }

  renderArrow = () => {
    const cx = [
      'infra-config__arrow',
      window.location.hash !== '#infra-config'
        && 'infra-config__arrow--hidden',
    ].filter(x => x).join(' ');
    return (
      <div className={cx} ref={this.handleBindArrowDOM}>
        <span className="infra-config__arrow-icon">&#11019;</span>
        <span className="infra-config__arrow-text">
          统一基础资源配置区域 (a.k.a Naming Service)
        </span>
      </div>
    );
  }

  render() {
    const { collapsedWhenAnchored } = this.state;
    const { loading, changing, isEditable, anchor } = this.props;
    const isAnchored = this.isAnchored();
    const items = InfraConfigItem.fromNestedData(this.props.data);
    const groups = _.sortBy(
      Object.values(_.groupBy(items, i => [i.infraType, i.infraName])),
      group => [
        !(isAnchored && group[0].matchAnchor(anchor)),
        (INFRA_TYPE_DISPLAY_ORDER[group[0].infraProtocol]
         || INFRA_TYPE_DISPLAY_ORDER[group[0].infraType]),
        group[0].infraName,
      ],
    ).filter(g => !collapsedWhenAnchored || !isAnchored || g[0].matchAnchor(anchor));
    return (
      <div className="infra-config" id="infra-config">
        {this.renderArrow()}
        <div className="infra-config__headline">
          <h4 className="infra-config__headline-title">
            Infrastructure Configuration
          </h4>
          <div className="infra-config__headline-buttons">
            <Button
              className="infra-config__headline-button"
              onClick={this.handleClickBind}
              disabled={loading || changing || !isEditable}
              title="创建配置项, 绑定已有资源"
              type="default"
            >
              添加已有资源
            </Button>
            <a
              className="infra-config__headline-button-link"
              href={hrefs.INFRA_CONFIG_APPLY_WIKI_URL}
              title="提交工单, 申请新资源"
              target="_blank"
              rel="noopener noreferrer"
            >
              申请新资源
            </a>
          </div>
        </div>
        <Table loading={changing}>
          <thead>
            <tr>
              <td>Type</td>
              <td>Code Name</td>
              <td>E-Zone</td>
              <td>Location</td>
              <td>
                <Button
                  onClick={this.handleClickRefresh}
                  title="Refresh"
                >
                  <Octicon name="sync" />
                </Button>
              </td>
            </tr>
          </thead>
          <tbody>
            {!loading && groups.map(this.renderGroup)}
          </tbody>
        </Table>
        {isAnchored && !loading && (
          <div className="infra-config__expand">
            <a
              href="#expand"
              className="infra-config__expand-anchor"
              onClick={this.handleClickExpand}
            >
              {collapsedWhenAnchored ? '+ Expand to show all' : '- Highlight only'}
            </a>
          </div>
        )}
      </div>
    );
  }
}

function mapStateToProps(state) {
  const changing = schemas.infraConfigChangingSelector(state);
  const version = schemas.infraConfigVersionSelector(state);
  const applicationNameList = schemas.applicationListSelector(state)
    .filter(application => !application.get('isDeprecated'))
    .filter(application => application.get('isInfra'))
    .map(application => application.get('name'))
    .filter(name => name)
    .sort();
  const wellKnownData = schemas.wellKnownDataSelector(state);
  return { changing, version, applicationNameList, wellKnownData };
}

function mapDispatchToProps(dispatch) {
  return {
    onSubmit(applicationName, infraType, infraName, scopeType, scopeName, value) {
      dispatch(actions.submitInfraConfig({
        applicationName,
        infraType: infraType.codeName,
        infraName,
        scopeType,
        scopeName,
        value,
      }));
    },
    onDelete(applicationName, infraType, infraName, scopeType, scopeName) {
      dispatch(actions.deleteInfraConfig({
        applicationName,
        infraType: infraType.codeName,
        infraName,
        scopeType,
        scopeName,
      }));
    },
    onRenameInfraName(applicationName, oldPayloads, newPayloads) {
      dispatch(actions.renameInfraName(applicationName, oldPayloads, newPayloads));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(InfraConfig);
