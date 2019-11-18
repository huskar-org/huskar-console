import React from 'react';
import PropTypes from 'prop-types';
import { routerShape, locationShape } from 'react-router';
import dialog from '../../services/dialog';
import SignInBox from './signin';

export default class SignIn extends React.Component {
  static propTypes = {
    router: routerShape.isRequired,
    location: locationShape.isRequired,
  };

  static propTypes = {
    location: PropTypes.shape({
      query: PropTypes.shape({
        next: PropTypes.string,
      }).isRequired,
      pathname: PropTypes.string.isRequired,
    }).isRequired,
  };

  componentDidMount() {
    dialog.then((c) => {
      c.popup(<SignInBox
        router={this.props.router}
        location={this.props.location}
      />);
      c.lock();
    });
  }

  componentWillUnmount() {
    dialog.then((c) => {
      c.unlock();
    });
  }

  render() {
    return <div />;
  }
}
