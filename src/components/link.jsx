import React from 'react';
import { Link, routerShape, locationShape } from 'react-router';

export default class FreeLink extends React.Component {
  static propTypes = {
    router: routerShape.isRequired,
    location: locationShape.isRequired,
  }

  static childContextTypes = {
    router: routerShape.isRequired,
    location: locationShape.isRequired,
  };

  getChildContext() {
    const { router, location } = this.props;
    return { router, location };
  }

  render() {
    const props = Object.assign({}, this.props);
    props.router = undefined;
    props.location = undefined;
    return <Link {...props} />;
  }
}
