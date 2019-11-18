import React from 'react';
import PropTypes from 'prop-types';
import Immutable from 'immutable';
import Button from 'components/button';
import TextField from 'components/textfield';
import cx from './keyvalue.sass';

class KeyValue extends React.Component {
  static propTypes = {
    defaultValue: PropTypes.objectOf(PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ])),
    onChange: PropTypes.func,
  };

  static defaultProps = {
    defaultValue: {},
    onChange: null,
  };

  constructor(props) {
    super(props);
    const items = new Immutable.Map(props.defaultValue)
      .mapEntries(p => p.map(String))
      .entrySeq()
      .map(([key, value]) => ({ key, value }))
      .toList();
    this.state = { items };
  }

  get value() {
    return this.state.items
      .filter(v => v.key)
      .reduce((r, v) => r.set(v.key, v.value), new Immutable.Map())
      .toJSON();
  }

  handleClickNew = () => {
    const item = { key: '', value: '' };
    const items = this.state.items.push(item);
    this.triggerUpdate(items);
  }

  editItem(item, key = '', value = '') {
    const { items } = this.state;
    const newItem = { key: key.trim(), value: value.trim() };
    const index = items.indexOf(item);
    if (index === -1) throw new Error('item detached');
    this.triggerUpdate(items.set(index, newItem));
  }

  removeItem(item) {
    const { items } = this.state;
    const index = items.indexOf(item);
    if (index === -1) throw new Error('item detached');
    this.triggerUpdate(items.delete(index));
  }

  triggerUpdate(items) {
    this.setState({ items }, () => {
      if (this.props.onChange) {
        this.props.onChange(items);
      }
    });
  }

  render() {
    return (
      <ul className={cx.keyvalue}>
        {this.state.items.map(item => (
          <li key={this.state.items.indexOf(item)}>
            <TextField
              onChange={e => this.editItem(item, e.target.value, item.value)}
              placeholder="Key"
              defaultValue={item.key}
            />
            <TextField
              onChange={e => this.editItem(item, item.key, e.target.value)}
              placeholder="Value"
              defaultValue={item.value}
            />
            <Button onClick={() => this.removeItem(item)} type="default">
              Remove
            </Button>
          </li>))}
        <li>
          <Button onClick={this.handleClickNew}>New</Button>
        </li>
      </ul>
    );
  }
}

export default KeyValue;
