import React from 'react';
import PropTypes from 'prop-types';
import Button from '../../button';
import TextField from '../../textfield';
import * as schemas from '../../../constants/schemas';
import cx from './editor.sass';

export default class Editor extends React.Component {
  static propTypes = {
    team: PropTypes.instanceOf(schemas.Team).isRequired,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
  };

  state = {
    applicationName: '',
  };

  handleChange = (event) => {
    const applicationName = event.target.value.trim();
    this.setState({ applicationName });
  }

  handleSubmit = () => {
    this.props.onSubmit(this.state.applicationName);
  }

  handleCancel = () => {
    this.props.onCancel();
  }

  render() {
    const { team } = this.props;
    const { applicationName } = this.state;
    const teamName = team.get('name');
    const teamDesc = team.get('desc');
    return (
      <dl key={`create-application-on-${teamName}`} className={cx.editor}>
        <dt>Create Application</dt>
        <dd>
          <table>
            <tbody>
              <tr>
                <td>Team: </td>
                <td>{teamDesc}({teamName})</td>
              </tr>
              <tr>
                <td>Application Name: </td>
                <td>
                  <TextField name="name" value={applicationName} onChange={this.handleChange} />
                </td>
              </tr>
              <tr>
                <td />
                <td>
                  <Button onClick={this.handleSubmit}>Save</Button>
                  &nbsp;&nbsp;
                  <Button type="default" onClick={this.handleCancel}>Cancel</Button>
                </td>
              </tr>
            </tbody>
          </table>
        </dd>
      </dl>
    );
  }
}
