import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import AutoComplete from './autocomplete';
import Button from './button';
import { handlePressEnterKey } from './utils';
import './tags.sass';

export default class Tags extends React.Component {
  static propTypes = {
    readOnly: PropTypes.bool,
    uniq: PropTypes.bool,
    tags: PropTypes.arrayOf(PropTypes.string),
    suggestions: PropTypes.arrayOf(PropTypes.string),
    onChange: PropTypes.func,
    onTagSelected: PropTypes.func,
  };

  static defaultProps = {
    readOnly: true,
    uniq: true,
    tags: [],
    suggestions: [],
    onChange: null,
    onTagSelected: null,
  };

  state = {
    activityTags: [],
    typingTag: null,
    inputVisible: false,
  };

  handleTagDelete = tag => () => {
    const tags = this.props.tags.filter(x => x !== tag);
    this.props.onChange(tags);
  };

  addTag = (tag) => {
    const { tags } = this.props;
    if (tags.indexOf(tag) === -1) {
      const newTags = tags.slice();
      newTags.push(tag);
      this.props.onChange(newTags);
    }
  };

  handleTagInputChange = (event, extraProps) => {
    const { inputValue } = extraProps;
    this.setState({ typingTag: inputValue });
  };

  handleTagConfirm = onBlur => (event) => {
    const { key, target } = event;
    const { value: tag } = target;
    this.setState(({ typingTag }) => {
      if ((typingTag || '').trim() && (key === 'Enter' || onBlur === true)) {
        this.addTag(tag);
        return { typingTag: null };
      }
      return {};
    });
    event.stopPropagation();
  };

  handleTagSelected = tag => () => {
    let { activityTags } = this.state;
    if (activityTags.indexOf(tag) === -1) {
      activityTags.push(tag);
    } else {
      activityTags = activityTags.filter(x => x !== tag);
    }
    this.setState({ activityTags }, () => this.props.onTagSelected(activityTags));
  };

  showInput = () => {
    this.setState({ inputVisible: true }, () => {
      if (this.saveTagInput) {
        this.saveTagInput.focus();
      }
    });
  };

  renderTag = (tag, tagCount, readOnly = true, uniq = true) => {
    const { activityTags } = this.state;
    const tagClass = activityTags.indexOf(tag) === -1
      ? 'tags__tag'
      : 'tags__tag tags__tag--active';

    return (
      <div className={tagClass}>
        <span
          role="button"
          tabIndex="-1"
          className="tags__tag-box"
          onClick={readOnly && this.handleTagSelected(tag)}
          onKeyPress={readOnly && handlePressEnterKey(this.handleTagSelected(tag))}
        >
          {uniq ? tag : `${tag}(${tagCount})`}
        </span>
        {!readOnly && (
          <span
            role="button"
            tabIndex="-1"
            className="tags__tag--editable"
            onClick={this.handleTagDelete(tag)}
            onKeyPress={handlePressEnterKey(this.handleTagDelete(tag))}
          />
        )}
      </div>);
  };

  render() {
    const { tags, suggestions, readOnly, uniq } = this.props;
    const { typingTag } = this.state;
    const tagsCount = _.countBy(tags);
    const uniqTags = Object.keys(tagsCount);
    const inputSuggestions = _.uniq(suggestions
      .filter(x => x.toLowerCase().indexOf(
        (typingTag || '').toLowerCase(),
      ) !== -1)
      .filter(x => uniqTags.indexOf(x) === -1))
      .map(x => ({ name: x, value: x }));
    return (
      <div className="tags__container">
        <ul className="tags__items">
          {uniqTags.map(tag => (
            <li className="tags__item" key={tag}>
              {this.renderTag(tag, tagsCount[tag], readOnly, uniq)}
            </li>
          ))}
        </ul>
        {!readOnly && (
          this.state.inputVisible ? (
            <div className="tags__input">
              <AutoComplete
                defaultValue={typingTag}
                candidates={inputSuggestions}
                onChange={this.handleTagInputChange}
                onKeyPress={this.handleTagConfirm(false)}
                onBlur={this.handleTagConfirm(true)}
                ref={(ref) => { this.saveTagInput = ref; }}
              />
            </div>
          ) : (
            <Button onClick={this.showInput}> + New Tag </Button>
          )
        )}
      </div>
    );
  }
}
