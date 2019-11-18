import React from 'react';
import PropTypes from 'prop-types';
import Autosuggest from 'react-autosuggest';
import cx from './textfield.sass';
import theme from './autocomplete.sass';

const mergedDefaultProps = {
  id: null,
  className: '',
  readOnly: false,
  onBlur: null,
  onFocus: null,
  disabled: false,
};

export default class AutoComplete extends React.Component {
  static propTypes = {
    defaultValue: PropTypes.string,
    candidates: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
    })),
    onChange: PropTypes.func,
    onFetch: PropTypes.func,
    onBlur: PropTypes.func,
    name: PropTypes.string,
    className: PropTypes.string,
    inputClassName: PropTypes.string,
  };

  static defaultProps = {
    defaultValue: '',
    candidates: [],
    onChange: null,
    onFetch: null,
    onBlur: null,
    name: null,
    className: '',
    inputClassName: '',
  };

  constructor(props) {
    super(props);
    this.state = { value: props.defaultValue || '', suggestions: [] };
    this.shouldDropData = false;
  }

  componentWillReceiveProps(nextProps) {
    const { defaultValue } = nextProps;
    const value = (defaultValue || '').toString();
    this.setState({ value });
  }

  componentWillUnmount() {
    this.shouldDropData = true;
  }

  getSuggestions = (value) => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;
    const { candidates } = this.props;

    return inputLength === 0 ? candidates : candidates.filter(item => (
      item.name.toLowerCase().slice(0, inputLength) === inputValue
    ));
  };

  getSuggestionValue = suggestion => suggestion.value;

  get value() {
    return this.state.value;
  }

  handleChange = (event, { newValue }) => {
    this.setState({ value: newValue });
    if (this.props.onChange !== null) {
      this.props.onChange(event, { inputName: this.props.name, inputValue: newValue });
    }
  };

  handleSuggestionsFetchRequested = ({ value }) => {
    if (this.props.onFetch) {
      this.props.onFetch(value).then((suggestions) => {
        if (this.shouldDropData) {
          return;
        }
        this.setState({ suggestions });
      });
    } else {
      this.setState({ suggestions: this.getSuggestions(value) });
    }
  };

  handleSuggestionsClearRequested = () => {
    this.setState({
      suggestions: [],
    });
  };

  focus = () => {
    this.innerInput.input.focus();
  }

  renderSuggestion = suggestion => (
    <div>
      {suggestion.name}
    </div>
  );

  render() {
    const { value, suggestions } = this.state;
    const { className, inputClassName } = this.props;
    const inputProps = Object.assign({}, mergedDefaultProps, this.props, {
      value, onChange: this.handleChange,
    });
    if (inputClassName) {
      inputProps.className = inputClassName;
    }
    return (
      <span className={`${cx.textfield} ${className}`}>
        <Autosuggest
          theme={theme}
          suggestions={suggestions}
          onSuggestionsFetchRequested={this.handleSuggestionsFetchRequested}
          onSuggestionsClearRequested={this.handleSuggestionsClearRequested}
          getSuggestionValue={this.getSuggestionValue}
          renderSuggestion={this.renderSuggestion}
          onBlur={this.props.onBlur}
          renderSuggestionsContainer={this.renderSuggestionsContainer}
          inputProps={inputProps}
          shouldRenderSuggestions={() => true}
          ref={(ref) => { this.innerInput = ref; }}
        />
      </span>
    );
  }
}
