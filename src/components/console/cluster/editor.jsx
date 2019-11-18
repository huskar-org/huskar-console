import React from 'react';
import PropTypes from 'prop-types';
import Button from 'components/button';
import { ClusterLabel } from 'components/inline';
import dialog from 'services/dialog';
import api from 'services/api';
import cx from './editor.sass';
import { Cluster } from '../../../structures';

export default class LinkEditor extends React.Component {
  static propTypes = {
    applicationName: PropTypes.string.isRequired,
    clusterName: PropTypes.string.isRequired,
    clusterPhysicalName: PropTypes.string,
    clusterList: PropTypes.arrayOf(PropTypes.string),
    onSubmit: PropTypes.func.isRequired,
  };

  static defaultProps = {
    clusterPhysicalName: null,
    clusterList: [],
  }

  state = {
    selectedClusterPhysicalZone: undefined,
    selectedClusterPhysicalName: undefined,
    isFrozen: false,
  }

  componentWillMount() {
    dialog.then(c => c.onSubmit(this.handleClickSave));
    this.timeouts = [];
  }

  componentWillUnmount() {
    this.timeouts.forEach(clearTimeout);
  }

  handleZoneChange = (event) => {
    const selectedClusterPhysicalZone = event.target.value;
    const selectedClusterPhysicalName = null;
    this.setState({ selectedClusterPhysicalZone, selectedClusterPhysicalName });
  }

  handleLinkChange = (event) => {
    const selectedClusterPhysicalName = event.target.value;
    this.setState({ selectedClusterPhysicalName });
  }

  handleClickUnlink = (event) => {
    event.preventDefault();
    const selectedClusterPhysicalZone = '';
    const selectedClusterPhysicalName = '';
    this.setState({ selectedClusterPhysicalZone, selectedClusterPhysicalName });
  }

  handleClickSave = () => {
    const { applicationName, clusterName, onSubmit } = this.props;
    const { selectedClusterPhysicalName, isFrozen } = this.state;

    if (isFrozen) return;

    this.setState({ isFrozen: true }, () => {
      const request = api.servicelink(applicationName)(clusterName);
      (!selectedClusterPhysicalName
        ? request.delete()
        : request.post({ link: selectedClusterPhysicalName })
      ).then((response) => {
        if (response.status < 400) {
          dialog.then(c => c.close());
          if (onSubmit !== undefined) onSubmit(response);
        } else {
          this.setState({ isFrozen: false });
        }
      });
    });
  }

  handleClickCancel = () => {
    dialog.then(c => c.close());
  }

  render() {
    const {
      applicationName,
      clusterName,
      clusterPhysicalName,
      clusterList,
    } = this.props;
    const cluster = Cluster.parse(clusterName);
    const {
      selectedClusterPhysicalZone,
      selectedClusterPhysicalName,
      isFrozen,
    } = this.state;
    const displayClusterPhysicalZone = (
      selectedClusterPhysicalZone === undefined
        ? Cluster.parse(clusterPhysicalName || '').ezone.name || ''
        : selectedClusterPhysicalZone
    );
    const displayClusterPhysicalName = (
      selectedClusterPhysicalName === undefined
        ? (clusterPhysicalName || '') : selectedClusterPhysicalName
    );
    const isUnchanged = (displayClusterPhysicalName || null) === clusterPhysicalName;

    const expandedClusterList = clusterList.slice(0);
    if (clusterPhysicalName && clusterList.indexOf(clusterPhysicalName) === -1) {
      expandedClusterList.push(clusterPhysicalName);
    }

    return (
      <dl key={applicationName + clusterName} className={cx.editor}>
        <dt>{`Edit ${applicationName} - ${cluster.ezone.name || 'GLOBAL'} - ${cluster.clusterName}`}</dt>
        <dd>
          <table className="form-table">
            <tbody>
              <tr className="cluster-preview">
                <td>Link to</td>
                <td>
                  {displayClusterPhysicalName
                    ? <ClusterLabel value={displayClusterPhysicalName} />
                    : <span>No link</span>}
                </td>
              </tr>
              <tr>
                <td>E-Zone</td>
                <td>
                  <select
                    value={displayClusterPhysicalZone}
                    onChange={this.handleZoneChange}
                  >
                    {Cluster.getZoneList().map(ezone => (
                      <option value={ezone.name || ''} key={ezone.name || 'global'}>
                        {ezone.name ? `${ezone.name} (${ezone.idc})` : '-'}
                      </option>))}
                  </select>
                </td>
              </tr>
              <tr>
                <td>Cluster</td>
                <td>
                  <select
                    value={displayClusterPhysicalName}
                    onChange={this.handleLinkChange}
                  >
                    <option value="">-</option>
                    {expandedClusterList
                      .filter(name => name !== clusterName)
                      .map(Cluster.parse)
                      .filter(c => (c.ezone.name || '') === displayClusterPhysicalZone)
                      .map(c => (
                        <option
                          value={c.toString()}
                          key={applicationName + clusterName + c.toString()}
                        >
                          {c.clusterName}
                        </option>
                      ))}
                    {clusterPhysicalName && clusterList.indexOf(clusterPhysicalName) === -1
                      ? <option value={clusterPhysicalName}>{clusterPhysicalName}</option>
                      : null}
                  </select>
                </td>
              </tr>
              <tr>
                <td>
                  <a
                    href="#unlink"
                    className="dangerous-button"
                    onClick={this.handleClickUnlink}
                  >
                    Unlink
                  </a>
                </td>
                <td className="buttons">
                  <Button
                    type="danger"
                    effect="delay"
                    tip="长按保存"
                    onClick={this.handleClickSave}
                    disabled={isUnchanged || isFrozen}
                  >
                    Save
                  </Button>
                  &nbsp;&nbsp;
                  <Button type="default" onClick={this.handleClickCancel} disabled={isFrozen}>
                    Cancel
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </dd>
      </dl>
    );
  }
}
