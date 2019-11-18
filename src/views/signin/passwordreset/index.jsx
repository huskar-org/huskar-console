import React from 'react';
import PropTypes from 'prop-types';
import { routerShape, locationShape } from 'react-router';
import dialog from '../../../services/dialog';
import SignInPasswordResetBox from './passwordreset';

export default class SignInPasswordReset extends React.Component {
  static propTypes = {
    router: routerShape.isRequired,
    location: locationShape.isRequired,
    params: PropTypes.shape({
      username: PropTypes.string,
      token: PropTypes.string,
    }).isRequired,
  }

  componentDidMount() {
    const { location, router } = this.props;
    const { username, token } = this.props.params;
    const props = { location, router };
    if (username && token) {
      Object.assign(props, { username, token });
    }

    dialog.then((c) => {
      c.popup(<SignInPasswordResetBox {...props} />);
      c.lock();
    });
  }

  componentWillUnmount() {
    dialog.then(c => c.unlock());
  }

  render() {
    return <div />;
  }
}
