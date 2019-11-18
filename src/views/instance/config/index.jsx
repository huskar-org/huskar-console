import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Octicon from 'react-octicon';
import _ from 'lodash';
import { routerShape, locationShape } from 'react-router';
import { ClusterLabel, TimelineLabel, EncryptedLabel } from '../../../components/inline';
import Button from '../../../components/button';
import TextField from '../../../components/textfield';
import Table from '../../../components/table';
import DialogConfirm from '../../../components/dialog/confirm';
import { InfraConfig } from '../../../components/infra';
import Alert from '../../../components/console/alert';
import Tags from '../../../components/tags';
import comfilter from '../../../decorators/comfilter';
import dialog from '../../../services/dialog';
import toast from '../../../services/toast';
import { isLongTextFragment } from '../../../services/utils/text';
import { InfraConfigTypes, Comment } from '../../../structures';
import { OVERALL_CLUSTER, ENCRYPTION_PREFIX } from '../../../constants/common';
import Editor from './editor';
import InstanceFile from '../file';
import * as schemas from '../../../constants/schemas';
import * as actions from '../../../actions';
import './index.sass';


class Config extends React.Component {
  static propTypes = {
    params: PropTypes.shape({
      applicationName: PropTypes.string.isRequired,
    }).isRequired,
    router: routerShape.isRequired,
    location: locationShape.isRequired,
    onLoad: PropTypes.func.isRequired,
    onCreateConfig: PropTypes.func.isRequired,
    onDeleteConfig: PropTypes.func.isRequired,
    isFetching: PropTypes.bool.isRequired,
    isChanging: PropTypes.bool.isRequired,
    instanceList: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.string.isRequired,
      application: PropTypes.string.isRequired,
      cluster: PropTypes.string.isRequired,
      key: PropTypes.string.isRequired,
      value: PropTypes.string,
      comment: PropTypes.instanceOf(Comment),
    })).isRequired,
    clusterNames: PropTypes.arrayOf(PropTypes.string).isRequired,
    tagList: PropTypes.arrayOf(PropTypes.string).isRequired,
    tagShowLists: PropTypes.arrayOf(PropTypes.string).isRequired,
    error: PropTypes.shape({
      status: PropTypes.string,
      message: PropTypes.string,
    }),
  };

  static defaultProps = {
    error: null,
  };

  state = {
    selectedTags: [],
    collapsedWhenAnchoredToInfraConfig: true,
    anchorOfInfraConfig: null,
  };

  componentDidMount() {
    this.handleRefresh();
  }

  componentWillReceiveProps(nextProps) {
    const { applicationName } = this.props.params;
    const nextApplicationName = nextProps.params.applicationName;
    if (applicationName !== nextApplicationName) {
      this.setState({ selectedTags: [] });
      this.props.onLoad(nextApplicationName);
    }

    // Show a dialog according to the query string
    const { query } = this.props.location;
    if (query.infra_type && query.infra_name && !this.state.anchorOfInfraConfig) {
      const anchorOfInfraConfig = {
        infraType: query.infra_type,
        infraName: query.infra_name,
      };
      this.setState({ anchorOfInfraConfig });
    }
    return true;
  }

  handleResetUrlQuery = () => {
    const { router, location } = this.props;
    const anchorOfInfraConfig = {};
    router.push(Object.assign({}, location, { query: {} }));
    this.setState({ anchorOfInfraConfig });
  }

  handleClickExpandConfig = (event) => {
    event.preventDefault();
    this.setState({ collapsedWhenAnchoredToInfraConfig: false });
  }

  handleClickCreateConfig = () => {
    const editor = (
      <Editor
        candidates={{
          clusterName: this.props.clusterNames,
          tagList: this.props.tagList,
        }}
        onSubmit={this.handleSubmitEditor()}
      />
    );
    dialog.then(c => c.popup(editor));
  };

  handleClickEditConfig = (item, options) => (event) => {
    if (event) {
      event.preventDefault();
    }
    const value = {
      cluster: item.cluster,
      key: item.key,
      value: item.value,
      comment: item.comment.getComment(),
      tags: item.comment.getTags(),
    };
    const mergedOptions = Object.assign({
      isDuplicating: false,
    }, options);
    const { clusterNames, tagList } = this.props;
    const editor = (
      <Editor
        candidates={{ clusterName: clusterNames, tagList }}
        defaultValue={value}
        onSubmit={this.handleSubmitEditor(item.meta && item.meta.version)}
        title={mergedOptions.isDuplicating ? 'Duplicate' : 'Edit'}
        isEditing={!mergedOptions.isDuplicating}
      />
    );
    dialog.then(c => c.popup(editor));
  };

  handleSubmitEditor = version => (data, isEditing) => {
    const { instanceList } = this.props;
    const { applicationName } = this.props.params;
    const isExisted = instanceList.some(item => (
      item.cluster === data.cluster
      && item.key === data.key
    ));
    if (InfraConfigTypes.findByKey(data.key)) {
      toast(<span>The key {data.key} is reserved.</span>);
      return false;
    }
    if (isExisted && !isEditing) {
      toast(<span>This key and cluster exists already.</span>);
      return false;
    }
    return this.props.onCreateConfig(applicationName, data.cluster, data, version);
  };

  handleDeleteConfig = (item) => {
    const { application, cluster, key } = item;
    this.props.onDeleteConfig(application, cluster, key);
  };

  handleTagSelected = (selectedTags) => {
    this.setState({ selectedTags });
  };

  handleClickRefresh = () => {
    this.handleRefresh();
  };

  handleRefresh = () => {
    const { applicationName } = this.props.params;
    this.props.onLoad(applicationName);
  };

  isEditable = () => (
    !this.props.isChanging
  );

  renderGroup = (items) => {
    const size = items.length;
    return _.sortBy(items, item => item.cluster !== OVERALL_CLUSTER)
      .map((item, idx) => this.renderItem(item, idx, size));
  };

  renderItem = (item, itemIndex, itemSize) => {
    // TODO: parse item.comment to Comment object
    const isEditable = this.isEditable();
    const isEncrypted = item.value && item.value.startsWith(ENCRYPTION_PREFIX);
    let itemValueLine;
    if (isEncrypted) {
      itemValueLine = EncryptedLabel();
    } else {
      itemValueLine = isLongTextFragment(item.value) ? (
        <a
          href="#too-long"
          className="too-long"
          onClick={this.handleClickEditConfig(item)}
          title="This is a long text fragment. Please click to see details."
        >
          Text fragment
        </a>) : (<code>{item.value}</code>);
    }

    return (
      <tr key={`${item.cluster}_${item.key}`}>
        {itemIndex === 0 && (
          <td rowSpan={itemSize} className="config__item-key">
            <code>{item.key}</code>
          </td>
        )}
        <td>
          <ClusterLabel value={item.cluster} allowDefault />
        </td>
        <td className="config__item-value">{itemValueLine}</td>
        <td className="config__item-comment">{item.comment.getComment()}</td>
        <td className="config__item-actions">
          <Button
            title="Edit this config"
            onClick={this.handleClickEditConfig(item)}
            disabled={!isEditable}
          >
            <Octicon name="pencil" />
          </Button>
          <Button
            title="Duplicate this config"
            onClick={this.handleClickEditConfig(item, { isDuplicating: true })}
            disabled={!isEditable}
          >
            <Octicon name="repo-forked" />
          </Button>
          <Button
            title="Remove this config"
            onClick={() => dialog.then(c => c.popup((
              <DialogConfirm
                description={`remove key "${item.key}" on cluster "${item.cluster}"`}
                onYes={async () => {
                  await this.handleDeleteConfig(item);
                  c.close();
                }}
                onNo={() => {
                  c.close();
                }}
              />
            )))}
            type="default"
            disabled={!isEditable}
          >
            <Octicon name="trashcan" />
          </Button>
          <Button>
            <TimelineLabel
              instanceType="config"
              application={item.application}
              cluster={item.cluster}
              instanceName={item.key}
            />
          </Button>
        </td>
      </tr>
    );
  }

  render() {
    const { applicationName } = this.props.params;
    const { isFetching, isChanging, error } = this.props;
    const {
      selectedTags,
      anchorOfInfraConfig,
      collapsedWhenAnchoredToInfraConfig,
    } = this.state;
    const loading = isFetching || isChanging;
    const collapsed = anchorOfInfraConfig !== null && collapsedWhenAnchoredToInfraConfig;
    const isEditable = this.isEditable();
    const infraData = this.props.instanceList
      .filter(item => item.cluster === OVERALL_CLUSTER)
      .filter(item => InfraConfigTypes.findByKey(item.key))
      .reduce((r, item) => Object.assign(r, { [item.key]: JSON.parse(item.value) }), {});
    const filteredKeys = this.props.instanceList
      .filter(item => (
        selectedTags.length === 0
        || selectedTags.some(tag => item.comment.getShowTags().indexOf(tag) >= 0)
      ))
      .map(item => item.key);
    const instanceList = this.props.instanceList
      .filter(item => filteredKeys.some(key => item.key === key));

    return (
      <div className="config__top">
        <div className="config__tags">
          <Tags
            tags={this.props.tagShowLists}
            onTagSelected={this.handleTagSelected}
            readOnly
            uniq={false}
            key={applicationName}
          />
        </div>
        <div className="config__filter">
          <TextField name="key" placeholder="key filter" onChange={this.onFilterChange} />
          <TextField name="cluster" placeholder="cluster filter" onChange={this.onFilterChange} />
          <div className="config__buttons">
            <InstanceFile
              type="import"
              isEditable={isEditable}
              applicationName={applicationName}
              instanceType="config"
              onCompleted={this.handleRefresh}
            />
            <InstanceFile
              type="export"
              isEditable={isEditable}
              applicationName={applicationName}
              instanceType="config"
              onCompleted={this.handleRefresh}
            />
            <Button onClick={this.handleClickCreateConfig} disabled={!isEditable}>Create</Button>
          </div>
        </div>
        <div className="config__content">
          <Table
            loading={!error && loading}
            collapsed={collapsed}
            collapsedTitle="业务配置"
            onClickExpand={this.handleClickExpandConfig}
          >
            <thead>
              <tr>
                <td>Key</td>
                <td>Cluster</td>
                <td>Value</td>
                <td>Comment</td>
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
              {error ? (
                <tr>
                  <td colSpan="5">
                    <Alert status={error.status} message={error.message}>
                      <span>{error}</span>
                    </Alert>
                  </td>
                </tr>
              ) : (
                Object.values(_.groupBy(instanceList
                  .filter(this.filter)
                  .filter(item => !InfraConfigTypes.findByKey(item.key)),
                'key')).map(this.renderGroup))}
            </tbody>
          </Table>
          <InfraConfig
            applicationName={applicationName}
            data={infraData}
            anchor={anchorOfInfraConfig}
            loading={loading}
            onChange={this.handleClickRefresh}
            onClearAnchor={this.handleResetUrlQuery}
            isEditable={isEditable}
          />
        </div>
      </div>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { applicationName } = ownProps.params;
  const instanceListSelector = schemas.instanceListSelector('config', applicationName);
  const isFetchingSelector = schemas.instanceFetchingSelector('config');
  const isChangingSelector = schemas.instanceChangingSelector('config');
  const errorSelector = schemas.instanceErrorSelector('config');
  const isFetching = isFetchingSelector(state);
  const isChanging = isChangingSelector(state);
  const instanceList = instanceListSelector(state).toJS()
    .map(item => Object.assign({}, item, { comment: Comment.parse(item.comment) }));
  const tagList = _.flatten(instanceList.map(item => item.comment.getTags()));
  const tagTmpList = _.flatten(instanceList
    .filter(item => !InfraConfigTypes.findByKey(item.key))
    .map(item => item.comment.getShowTags()));
  const tagShowLists = new Set(tagTmpList).size > 1 ? tagTmpList : [];
  const error = errorSelector(state);
  // TODO: should use service cluster here
  const clusterNames = _.uniq(instanceList.map(item => item.cluster));
  return { isFetching, isChanging, instanceList, clusterNames, tagList, tagShowLists, error };
}

function mapDispatchToProps(dispatch) {
  const type = 'config';
  return {
    onLoad: (application) => {
      dispatch(actions.batchFetchInstances(type, application));
    },
    onCreateConfig: (application, cluster, data, version) => {
      const instanceData = Object.assign({}, data, {
        comment: new Comment({ general: data.comment, tags: data.tags }),
      });
      const action = actions.createInstance(
        type, application, cluster, instanceData, version,
      );
      return dispatch(action);
    },
    onDeleteConfig: (application, cluster, key) => {
      const action = actions.deleteInstance(type, application, cluster, key);
      return dispatch(action);
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(comfilter(Config));
