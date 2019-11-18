import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { connect } from 'react-redux';
import * as actions from '../../../actions';
import * as schemas from '../../../constants/schemas';

class ClusterCandidateList extends React.Component {
  static propTypes = {
    value: PropTypes.string.isRequired,
    clusterList: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      meta: PropTypes.shape({
        instanceCount: PropTypes.number,
      }).isRequired,
      physicalName: PropTypes.string,
    })).isRequired,
    applicationName: PropTypes.string,
    className: PropTypes.string,
    scopeName: PropTypes.string,
    isFetching: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired,
    onFetch: PropTypes.func.isRequired,
    scopeNameList: PropTypes.arrayOf(PropTypes.string).isRequired,
  };

  static defaultProps = {
    applicationName: '',
    className: '',
    scopeName: '',
  };

  componentDidMount() {
    const { onFetch, onChange, applicationName, value, clusterList } = this.props;
    if (applicationName) {
      onFetch(applicationName);
    } else {
      this.autoFillBestClusterName(value, clusterList, onChange);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.applicationName !== this.props.applicationName) {
      nextProps.onChange(); // Clear previous state
      nextProps.onFetch(nextProps.applicationName);
    } else {
      const { value, clusterList, onChange } = nextProps;
      this.autoFillBestClusterName(value, clusterList, onChange);
    }
  }

  getIdcPrefix = (idc) => {
    const { scopeNameList } = this.props;
    const idcList = scopeNameList
      .filter(name => name !== 'global');
    if (!idcList.includes(idc)) {
      return '';
    }
    const match = /^([a-z]+)\d*$/.exec(idc);
    return match ? match[1] : '';
  };

  autoFillBestClusterName = (currentName, clusterList, onChange) => {
    if (currentName || clusterList.length === 0) {
      return;
    }
    const selectedName = this.selectBestClusterName(clusterList);
    if (selectedName) {
      onChange({ value: selectedName });
    }
  };

  selectBestClusterName = (clusterList) => {
    const { scopeName } = this.props;
    const currentIdcPrefix = this.getIdcPrefix(scopeName);
    const sameIdcClusterList = clusterList
      .filter(c => c.name.indexOf(currentIdcPrefix) !== -1);
    sameIdcClusterList.sort((a, b) => {
      if (/[a-z]+$/.exec(a.name)) {
        return -1;
      }
      if (/[a-z]+$/.exec(b.name)) {
        return -1;
      }
      return +(a.name > b.name) || +(a.name === b.name) - 1;
    });
    return sameIdcClusterList.length > 0 ? sameIdcClusterList[0].name : '';
  };

  renderDummy(message) {
    const { className } = this.props;
    return (
      <Select
        className={className}
        placeholder={message}
        disabled
      />
    );
  }

  render() {
    const {
      applicationName, className, value, clusterList, isFetching, onChange,
    } = this.props;
    if (isFetching) {
      return this.renderDummy('Loading');
    }
    if (clusterList.length === 0 || !applicationName) {
      return this.renderDummy('Empty');
    }
    const options = clusterList
      .map(cluster => ({
        name: cluster.name,
        desc: cluster.physicalName
          ? `symlink of ${cluster.physicalName}`
          : `${cluster.meta.instanceCount} nodes`,
      }))
      .map(({ name, desc }) => ({
        label: `${name} (${desc})`,
        value: name,
      }));
    return (
      <Select
        className={className}
        value={value}
        onChange={onChange}
        options={options}
        placeholder="Choose a cluster"
      />
    );
  }
}

function mapStateToProps(state, ownProps) {
  const { applicationName } = ownProps;
  const isFetching = schemas.instanceFetchingSelector('service')(state);
  const clusterList = schemas.clusterListSelector('service', applicationName)(state).toJS();
  return { isFetching, clusterList };
}

function mapStateToDispatch(dispatch) {
  return {
    onFetch: (applicationName) => {
      dispatch(actions.fetchClusterList('service', applicationName));
    },
  };
}

export default connect(mapStateToProps, mapStateToDispatch)(ClusterCandidateList);
