import _ from 'lodash';
import { PropTypes } from 'prop-types';

function searchByKeyword(text, keyword) {
  if (keyword === '') {
    return true;
  }
  if (
    keyword.length >= 2
    && keyword.startsWith('/')
    && keyword.endsWith('/')
  ) {
    const regexp = new RegExp(keyword.slice(1, -1), 'i');
    return regexp.test(text);
  }
  return text.toLowerCase().includes(keyword.toLowerCase());
}

export default function (Component) {
  class WrappedComponent extends Component {
    static propTypes = {
      onSearch: PropTypes.func,
    };

    static defaultProps = {
      onSearch: null,
    };

    onFilterChange = (event) => {
      this.filterData = this.filterData || {};
      const { name, value } = event.target;
      this.filterData[name] = (value || '').trim();
      this.forceUpdate();
    }

    onSearchChange = field => (event) => {
      this.searchFields = this.searchFields || {};
      const { value } = event.target;
      this.searchFields[field] = (value || '').trim().toLowerCase();
      this.forceUpdate();
    }

    filter = (item, handler) => {
      const { onSearch } = this.props;
      this.filterData = this.filterData || {};
      this.searchFields = this.searchFields || {};
      const entity = _.isFunction(handler) ? handler(item) : item;
      if (onSearch) {
        return Object
          .keys(this.searchFields)
          .every(key => onSearch(entity, key, this.searchFields[key]));
      }
      return Object
        .keys(this.filterData)
        .every(key => searchByKeyword(
          _.toString(entity[key] === undefined ? (entity.get || String)(key) : entity[key]),
          this.filterData[key],
        ));
    }
  }

  Object.defineProperty(WrappedComponent, 'name', {
    value: Component.name,
    writable: false,
  });

  return WrappedComponent;
}
