import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { connect } from 'react-redux';
import Octicon from 'react-octicon';
import { ClusterLabel, TimelineLabel } from '../../../components/inline';
import Button from '../../../components/button';
import TextField from '../../../components/textfield';
import DialogConfirm from '../../../components/dialog/confirm';
import Table from '../../../components/table';
import dialog from '../../../services/dialog';
import toast from '../../../services/toast';
import comfilter from '../../../decorators/comfilter';
import Editor from './editor';
import Tags from '../../../components/tags';
import Comment from '../../../structures/comment';
import { OVERALL_CLUSTER } from '../../../constants/common';
import * as schemas from '../../../constants/schemas';
import * as actions from '../../../actions';
import InstanceFile from '../file';
import './index.sass';

class Switch extends React.Component {
  static propTypes = {
    params: PropTypes.shape({
      applicationName: PropTypes.string.isRequired,
    }).isRequired,
    onLoad: PropTypes.func.isRequired,
    onCreateSwitch: PropTypes.func.isRequired,
    onDeleteSwitch: PropTypes.func.isRequired,
    isFetching: PropTypes.bool.isRequired,
    isChanging: PropTypes.bool.isRequired,
    instanceList: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.string.isRequired,
      application: PropTypes.string.isRequired,
      cluster: PropTypes.string.isRequired,
      key: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      comment: PropTypes.instanceOf(Comment),
    })).isRequired,
    clusterNames: PropTypes.arrayOf(PropTypes.string).isRequired,
    tagLists: PropTypes.arrayOf(PropTypes.string).isRequired,
    tagShowLists: PropTypes.arrayOf(PropTypes.string).isRequired,
  };

  state = {
    selectedTags: [],
  };

  componentDidMount() {
    this.handleRefresh();
  }

  componentWillReceiveProps(nextProps) {
    const { applicationName } = this.props.params;
    const nextApplicationName = nextProps.params.applicationName;
    if (applicationName !== nextApplicationName) {
      this.setState({ selectedTags: [] });
      return this.props.onLoad(nextApplicationName);
    }

    return true;
  }

  handleClickRefresh = () => {
    this.handleRefresh();
  };

  handleRefresh = () => {
    const { applicationName } = this.props.params;
    const { onLoad } = this.props;
    onLoad(applicationName);
  };

  handleClickCreateSwitch = () => {
    const editor = (
      <Editor
        candidates={{
          key: [],
          clusterName: this.props.clusterNames,
          tagList: this.props.tagLists,
        }}
        onSubmit={this.handleSubmitEditor()}
      />
    );
    dialog.then(c => c.popup(editor));
  };

  handleClickEditSwitch = (item, options = {}) => () => {
    const value = {
      cluster: item.cluster,
      key: item.key,
      value: item.value.toString(),
      comment: item.comment.getComment(),
      tags: item.comment.getTags(),
    };
    const { clusterNames, tagLists } = this.props;
    const mergedOptions = Object.assign({ isDuplicating: false }, options);
    const editor = (
      <Editor
        candidates={{ key: [], clusterName: clusterNames, tagList: tagLists }}
        defaultValue={value}
        onSubmit={this.handleSubmitEditor(item.meta && item.meta.version)}
        title={mergedOptions.isDuplicating ? 'Duplicate' : 'Edit'}
        isEditing={!mergedOptions.isDuplicating}
      />
    );
    dialog.then(c => c.popup(editor));
  };

  handleSubmitEditor = version => (data, isEditing) => {
    const { applicationName } = this.props.params;
    const { instanceList } = this.props;
    const isExisted = instanceList.some(item => (
      item.cluster === data.cluster
      && item.key === data.key
    ));
    if (isExisted && !isEditing) {
      toast(<span>This key and cluster exists already.</span>);
      return false;
    }
    this.props.onCreateSwitch(applicationName, data.cluster, data, version);
    return true;
  };

  handleDeleteSwitch = (item) => {
    const { application, cluster, key } = item;
    return this.props.onDeleteSwitch(application, cluster, key);
  };

  isStringValue = value => (
    value && Number.isNaN(+value)
  );

  handleTagSelected = (selectedTags) => {
    this.setState({ selectedTags });
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
    const isEditable = this.isEditable();
    let itemValueField;
    if (this.isStringValue(item.value)) {
      itemValueField = <span>{item.value}</span>;
    } else {
      itemValueField = (
        <div className="switch__item-value--progress">
          <progress value={item.value} max="100" min="0" />
          <span>{(+item.value).toFixed(2)}</span>
        </div>
      );
    }

    return (
      <tr key={`${item.cluster}#${item.key}`}>
        {itemIndex === 0 && (
          <td rowSpan={itemSize} className="switch__item-key">
            <code>{item.key}</code>
          </td>
        )}
        <td>
          <ClusterLabel value={item.cluster} allowDefault />
        </td>
        <td className="switch__item-value">{itemValueField}</td>
        <td className="switch__item-comment">{item.comment.getComment()}</td>
        <td className="switch__item-actions">
          <Button
            title="Edit this switch"
            onClick={this.handleClickEditSwitch(item)}
            disabled={!isEditable}
          >
            <Octicon name="pencil" />
          </Button>
          <Button
            title="Duplicate this switch"
            onClick={this.handleClickEditSwitch(item, { isDuplicating: true })}
            disabled={!isEditable}
          >
            <Octicon name="repo-forked" />
          </Button>
          <Button
            title={`Remove this ${item.key}[${item.cluster}]`}
            onClick={() => dialog.then(c => c.popup(<DialogConfirm
              description={`remove key "${item.key}" on cluster "${item.cluster}"`}
              onYes={async () => {
                await this.handleDeleteSwitch(item);
                c.close();
              }}
              onNo={() => {
                c.close();
              }}
            />))}
            type="default"
            disabled={!isEditable}
          >
            <Octicon name="trashcan" />
          </Button>
          <Button>
            <TimelineLabel
              instanceType="switch"
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
    const { isFetching, isChanging } = this.props;
    const { selectedTags } = this.state;
    const loading = isFetching || isChanging;
    const isEditable = this.isEditable();
    const filteredKeys = this.props.instanceList
      .filter(item => (
        selectedTags.length === 0
        || selectedTags.some(tag => (
          item.comment.getShowTags().indexOf(tag) >= 0
        ))
      ))
      .map(item => item.key);
    const instanceList = this.props.instanceList
      .filter(item => filteredKeys.some(key => item.key === key));

    return (
      <div className="switch__top">
        <div className="switch__tags">
          <Tags
            tags={this.props.tagShowLists}
            onTagSelected={this.handleTagSelected}
            readOnly
            uniq={false}
            key={applicationName}
          />
        </div>
        <div className="switch__filter">
          <TextField name="key" placeholder="key filter" onChange={this.onFilterChange} />
          &nbsp;&nbsp;
          <TextField name="cluster" placeholder="cluster filter" onChange={this.onFilterChange} />
          <div className="switch__buttons">
            <InstanceFile
              type="import"
              isEditable={isEditable}
              applicationName={applicationName}
              instanceType="switch"
              onCompleted={this.handleRefresh}
            />
            <InstanceFile
              type="export"
              isEditable={isEditable}
              applicationName={applicationName}
              instanceType="switch"
              onCompleted={this.handleRefresh}
            />
            <Button onClick={this.handleClickCreateSwitch} disabled={!isEditable}>Create</Button>
          </div>
        </div>
        <div className="switch__content">
          <Table loading={loading}>
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
              {Object.values(_.groupBy(
                instanceList
                  .filter(this.filter),
                'key',
              )).map(this.renderGroup)}
            </tbody>
          </Table>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { applicationName } = ownProps.params;
  const instanceListSelector = schemas.instanceListSelector('switch', applicationName);
  const isFetchingSelector = schemas.instanceFetchingSelector('switch');
  const isChangingSelector = schemas.instanceChangingSelector('switch');
  const isFetching = isFetchingSelector(state);
  const isChanging = isChangingSelector(state);
  const instanceList = instanceListSelector(state).toJS()
    .map(item => Object.assign({}, item, { comment: Comment.parse(item.comment) }));
  const tagLists = _.flatten(instanceList.map(item => item.comment.getTags()));
  const tagTmpList = _.flatten(instanceList.map(item => item.comment.getShowTags()));
  const tagShowLists = new Set(tagTmpList).size > 1 ? tagTmpList : [];
  const clusterNames = _.uniq(instanceList.map(item => item.cluster));
  return { isFetching, isChanging, instanceList, clusterNames, tagLists, tagShowLists };
}

function mapDispatchToProps(dispatch) {
  const type = 'switch';
  return {
    onLoad: (application) => {
      dispatch(actions.batchFetchInstances(type, application));
    },
    onCreateSwitch: (application, cluster, data, version) => {
      const instanceData = Object.assign({}, data, {
        comment: new Comment({ general: data.comment, tags: data.tags }),
      });
      const action = actions.createInstance(type, application, cluster, instanceData, version);
      return dispatch(action);
    },
    onDeleteSwitch: (application, cluster, key) => {
      const action = actions.deleteInstance(type, application, cluster, key);
      return dispatch(action);
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(comfilter(Switch));
