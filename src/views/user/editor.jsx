import React from 'react';
import PropTypes from 'prop-types';
import Button from '../../components/button';
import TextField from '../../components/textfield';
import dialog from '../../services/dialog';
import HuskarModel from '../../services/huskarmodel';
import './editor.sass';

export default class Editor extends React.Component {
  static propTypes = {
    data: PropTypes.shape({
      cluster: PropTypes.string,
      key: PropTypes.string,
      username: PropTypes.string,
      email: PropTypes.string,
    }),
    title: PropTypes.string,
  };

  static defaultProps = {
    data: {},
    title: 'Edit',
  };

  constructor() {
    super();
    this.state = {};
    this.fields = {};
  }

  componentDidMount() {
    this.handlePropsToState(this.props.data);
    dialog.then(c => c.onSubmit(this.save));
  }

  componentWillReceiveProps(nextProps) {
    this.handlePropsToState(nextProps.data);
  }

  handlePropsToState = (data) => {
    const usernameProps = {};
    const emailProps = {};
    if (Object.keys(data).length) {
      usernameProps.readOnly = true;
      emailProps.readOnly = true;
    }
    this.setState({ usernameProps, emailProps });
  }

  getFormData = () => {
    const data = {};
    Object.keys(this.fields).forEach((i) => {
      data[i] = this.fields[i].state.value || '';
    });
    return data;
  }

  save = async () => {
    const response = await HuskarModel.addUser(this.getFormData());
    if (response.status < 400) {
      dialog.then(c => c.close());
    }
    return response;
  }

  render() {
    const { title } = this.props;
    const { cluster, key, username, email } = this.props.data;
    return (
      <dl key={cluster + key} className="dialog-user-editor">
        <dt>{ title }</dt>
        <dd>
          <table>
            <tbody>
              <tr>
                <td className="dialog-user-editor__field dialog-user-editor__field--first">User Name: </td>
                <td className="dialog-user-editor__field">
                  <TextField ref={(c) => { this.fields.username = c; }} name="cluster" defaultValue={username} {...this.state.usernameProps} />
                </td>
              </tr>
              <tr>
                <td className="dialog-user-editor__field dialog-user-editor__field--first">E-Mail: </td>
                <td className="dialog-user-editor__field">
                  <TextField ref={(c) => { this.fields.email = c; }} name="email" defaultValue={email} {...this.state.emailProps} />
                </td>
              </tr>
              <tr>
                <td className="dialog-user-editor__field dialog-user-editor__field--first" />
                <td className="dialog-user-editor__field">
                  <Button onClick={this.save}>Save</Button>
                  &nbsp;&nbsp;
                  <Button type="default" onClick={() => { dialog.then(c => c.close()); }}>Cancel</Button>
                </td>
              </tr>
            </tbody>
          </table>
        </dd>
      </dl>
    );
  }
}
