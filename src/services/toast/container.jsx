import React from 'react';
import PropTypes from 'prop-types';
import cx from './container.sass';

export default class Toast extends React.Component {
  static propTypes = {
    duration: PropTypes.number,
  };

  static defaultProps = {
    duration: 2000,
  };

  state = {
    id: 0,
    queue: [],
  };

  draw = (content) => {
    const item = { content, id: this.state.id };
    this.setState(state => ({
      id: state.id + 1,
      queue: state.queue.concat([item]),
    }), () => {
      setTimeout(() => {
        this.setState(state => ({
          queue: state.queue.filter(i => i !== item),
        }));
      }, this.props.duration);
    });
  }

  render() {
    const { duration } = this.props;
    const { queue } = this.state;
    const delaySeconds = duration * 0.2;
    const fadeOutSeconds = duration * 0.8;
    const style = {
      animation: `simpletoast ${delaySeconds}ms linear forwards`,
      animationDelay: `${fadeOutSeconds}ms`,
    };
    return (
      <div className={cx.container}>
        {queue.map(item => (
          <div key={item.id} style={style}>
            {item.content}
          </div>
        ))}
      </div>
    );
  }
}
