import React from 'react';
import PropTypes from 'prop-types';
import Button from '../../button';
import TextField from '../../textfield';
import dialog from '../../../services/dialog';
import cx from './editor.sass';

export default class Editor extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    applicationName: PropTypes.string.isRequired,
    onSubmit: PropTypes.func.isRequired,
  };

  static defaultProps = {
    title: 'Edit',
  };

  state = {
    username: '',
    authority: 'read',
  };

  handleChange = key => (e) => {
    this.setState({ [key]: e.target.value });
  }

  handleSubmit = () => {
    const { username, authority } = this.state;
    this.props.onSubmit(this.props.applicationName, username, authority);
    dialog.then(c => c.close());
  }

  render() {
    return (
      <dl className={cx.editor}>
        <dt>{ this.props.title }</dt>
        <dd>
          <table>
            <tbody>
              <tr>
                <td>User / Application: </td>
                <td>
                  <TextField
                    name="username"
                    onChange={this.handleChange('username')}
                  />
                </td>
              </tr>
              <tr>
                <td>Privilege</td>
                <td>
                  <select
                    name="authority"
                    onChange={this.handleChange('authority')}
                  >
                    <option value="read">Read</option>
                    <option value="write">Write</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td />
                <td>
                  <Button
                    onClick={this.handleSubmit}
                    type="danger"
                    effect="delay"
                  >
                    Save
                  </Button>
                  &nbsp;&nbsp;
                  <Button type="default" onClick={() => dialog.then(c => c.close())}>Cancel</Button>
                </td>
              </tr>
            </tbody>
          </table>
        </dd>
      </dl>
    );
  }
}
