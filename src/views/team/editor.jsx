import React from 'react';
import PropTypes from 'prop-types';
import Button from '../../components/button';
import TextField from '../../components/textfield';
import './editor.sass';

export default class Editor extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    onSubmit: PropTypes.func,
    onCancel: PropTypes.func,
  };

  static defaultProps = {
    title: 'Create Team',
    onSubmit: () => undefined,
    onCancel: () => undefined,
  };

  constructor() {
    super();
    this.state = {
      teamName: '',
    };
  }

  handleChange = (event) => {
    const teamName = event.target.value.trim();
    this.setState({ teamName });
  }

  handleSubmit = () => {
    this.props.onSubmit(this.state.teamName);
  }

  handleCancel = () => {
    this.props.onCancel();
  }

  render() {
    const { title } = this.props;
    const { teamName } = this.state;
    return (
      <dl key="team-editor" className="dialog-team-editor">
        <dt>{title}</dt>
        <dd>
          <table>
            <tbody>
              <tr>
                <td>Team Name: </td>
                <td>
                  <TextField name="name" value={teamName} onChange={this.handleChange} />
                </td>
              </tr>
              <tr>
                <td />
                <td>
                  <Button onClick={this.handleSubmit}>Save</Button>
                  &nbsp;&nbsp;
                  <Button type="default" onClick={this.handleCancel}>
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
