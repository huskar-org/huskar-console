import React from 'react';
import PropTypes from 'prop-types';
import Button from 'components/button';
import TextField from 'components/textfield';
import Team from 'services/huskarmodel/team';
import dialog from 'services/dialog';
import cx from './editor.sass';

export default class Editor extends React.Component {
  static propTypes = {
    data: PropTypes.shape({
      cluster: PropTypes.string,
      key: PropTypes.string,
    }),
    team: PropTypes.instanceOf(Team).isRequired,
    title: PropTypes.string,
  }

  static defaultProps = {
    data: {},
    title: 'Editor',
  };

  constructor() {
    super();
    this.state = { privilege: 'admin' };
  }

  componentDidMount() {
    dialog.then(c => c.onSubmit(this.save));
  }

  save = async () => {
    const { username, privilege } = this.state;
    const result = await this.props.team.createPrivilege({ username, privilege });
    if (result.status < 400) {
      dialog.then(c => c.close());
    }
  }

  handleEdit = (event) => {
    const username = event.target.value;
    this.setState({ username });
  }

  render() {
    const { title, team } = this.props;
    const { cluster, key } = this.props.data;
    return (
      <dl key={cluster + key} className={cx.editor}>
        <dt>{ title }</dt>
        <dd>
          <table>
            <tbody>
              <tr>
                <td>Team: </td>
                <td>{team.desc}({team.name})</td>
              </tr>
              <tr>
                <td>User Name: </td>
                <td><TextField onChange={this.handleEdit} value={this.state.username} name="username" /></td>
              </tr>
              <tr>
                <td />
                <td>
                  <Button onClick={this.save}>Save</Button>
                  &nbsp;&nbsp;
                  <Button
                    type="default"
                    onClick={() => { dialog.then(c => c.close()); }}
                  >
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
