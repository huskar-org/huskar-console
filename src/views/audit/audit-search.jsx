import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import Select from '../../components/select';
import TextField from '../../components/textfield';
import { handlePressEnterKey } from '../../components/utils';
import * as types from './types';

const ACTION_TYPES = _.keys(types);
const SEARCH_TYPES = ['user', 'config', 'switch', 'service', 'actions'];
const INSTANCE_TYPES = ['config', 'switch', 'service'];

const defaultValueFields = {
  search: false,
  exclude: 'user',
  keywords: '',
};

export default class AuditSearch extends React.Component {
  static propTypes = {
    onSearch: PropTypes.func.isRequired,
    defaultValue: PropTypes.shape({
      search: PropTypes.string,
      exclude: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.bool,
      ]),
      keywords: PropTypes.string,
    }).isRequired,
  };

  state = {
    searchBy: {
      exclude: false,
      search: 'user',
      keywords: null,
    },
  };

  collectDefaultValue = () => Object.assign(
    {}, defaultValueFields, this.props.defaultValue,
  );

  collectForm = () => {
    const { searchBy } = this.state;
    const defaultValue = this.collectDefaultValue();
    const search = searchBy.search || defaultValue.search;
    const keywords = searchBy.keywords === null ? defaultValue.keywords : searchBy.keywords;
    const exclude = searchBy.exclude || Number(defaultValue.exclude, 10);
    return { search, keywords, exclude };
  };

  handleSearch = (searchBy) => {
    const { onSearch } = this.props;
    const defaultValue = this.collectDefaultValue();
    const searchOptions = Object.assign({}, defaultValue, searchBy);
    onSearch(searchOptions);
  };

  handleSearchTypeChange = (event) => {
    const { value } = event.target;
    const searchBy = {
      search: value,
      keywords: '',
      exclude: false,
    };
    this.setState({ searchBy });
  };

  handleSearchInputChange = (keywords) => {
    this.setState(prevState => ({
      searchBy: Object.assign({}, prevState.searchBy, { keywords }),
    }));
  };

  handleExcludeToggle = () => {
    this.setState(prevState => ({
      searchBy: Object.assign(
        {}, prevState.searchBy, { exclude: !prevState.searchBy.exclude },
      ),
    }), () => {
      this.handleSearch(this.state.searchBy);
    });
  };

  handleEnterKeyPress = (e) => {
    if (e.key === 'Enter') {
      // search if Enter press
      const { searchBy } = this.state;
      this.handleSearch(searchBy);
    }
  };

  handleClickSearch = () => {
    const { searchBy } = this.state;
    this.handleSearch(searchBy);
  };

  renderInput = (searchType, searchInput) => {
    const placeholder = INSTANCE_TYPES.indexOf(searchType) === -1
      ? `${searchType} search`
      : 'search with "key:cluster" or "key"';
    const actionList = ACTION_TYPES.map(value => ({ label: value, value }));
    return (searchType === 'actions') ? (
      <Select
        multi
        simpleValue
        autosize
        placeholder={placeholder}
        options={actionList}
        onChange={value => this.handleSearchInputChange(value)}
      />
    ) : (
      <TextField
        placeholder={placeholder}
        onChange={event => this.handleSearchInputChange(event.target.value)}
        value={searchInput}
        className="audit-search__input-text"
      />
    );
  };

  render() {
    const { search, keywords, exclude } = this.collectForm();
    return (
      <div>
        <div
          className="audit-search"
          role="presentation"
          onKeyPress={this.handleEnterKeyPress}
        >
          <div className="audit-search__prepend">
            <select
              name="audit-search"
              onChange={this.handleSearchTypeChange}
              value={search}
            >
              {SEARCH_TYPES.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <div className="audit-search__input">
            <div className="audit-search__content">
              {this.renderInput(search, keywords)}
              <span
                className="audit-search__input--icon"
                role="button"
                tabIndex={0}
                onClick={this.handleClickSearch}
                onKeyPress={handlePressEnterKey(this.handleClickSearch)}
              />
            </div>
            {search === 'user' && (
              <div>
                <input
                  className="audit-search__exclude"
                  type="checkbox"
                  checked={!!exclude}
                  onChange={this.handleExcludeToggle}
                />
                <span className="audit-search__exclude-explain">
                  {`exclude ${search}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
