import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Button from '../../button';
import api from '../../../services/api';
import dialog from '../../../services/dialog';
import * as schemas from '../../../constants/schemas';
import cx from './editor.sass';

class ReplicationEditor extends React.Component {
  static propTypes = {
    isApplicationLoading: PropTypes.bool.isRequired,
    applicationName: PropTypes.string.isRequired,
    applicationList: PropTypes.arrayOf(PropTypes.instanceOf(schemas.Application)).isRequired,
  };

  constructor() {
    super();
    this.state = { value: '', loading: true };
  }

  componentDidMount() {
    const { applicationName } = this.props;
    api.replication(applicationName).get().then((response) => {
      if (response.status < 400) {
        const { data } = response.data;
        this.setState({ value: data.peer || '', loading: false });
      }
    });
  }

  handleChange = (event) => {
    this.setState({ value: event.target.value });
  }

  handleSave = async () => {
    const { applicationName } = this.props;
    const { value } = this.state;
    let response;
    if (value) {
      response = await api.replication(applicationName).post({ peer: value });
    } else {
      response = await api.replication(applicationName).delete();
    }
    if (response.status < 400) {
      (await dialog).close();
    }
  }

  handleClose = async () => {
    (await dialog).close();
  }

  render() {
    const { applicationName, applicationList, isApplicationLoading } = this.props;
    const { value } = this.state;
    const loading = this.state.loading || isApplicationLoading;
    const applicationCandidates = applicationList
      .map(application => application.get('name', '').trim())
      .filter(name => name && name !== applicationName);
    if (applicationCandidates.indexOf(value) === -1) {
      applicationCandidates.push(value);
    }
    applicationCandidates.sort();
    applicationCandidates.unshift('');

    const options = applicationCandidates.map(name => (
      <option key={`${applicationName}:${name}`} value={name}>
        {name || '-'}
      </option>));

    return (
      <dl key={applicationName} className={cx.editor}>
        <dt>Application Replication</dt>
        <dd>
          <div>
            <div className={cx.peer}>
              <input type="text" value={applicationName} disabled="true" />
              <span className="arrow">&#8644;</span>
              <select value={value} disabled={loading} onChange={this.handleChange}>
                {options}
              </select>
            </div>
            <div className={cx.buttons}>
              <Button onClick={this.handleSave} disabled={loading}>Save</Button>
              <Button type="default" onClick={this.handleClose}>Cancel</Button>
            </div>
          </div>
        </dd>
      </dl>
    );
  }
}

function mapStateToProps(state) {
  const isApplicationLoading = schemas.applicationTreeLoadingSelector(state);
  const applicationList = schemas.applicationListSelector(state);
  return { applicationList, isApplicationLoading };
}

export default connect(mapStateToProps)(ReplicationEditor);
