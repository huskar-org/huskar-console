import _ from 'lodash';
import URL from 'url-parse';
import {
  INFRA_CONFIG_TYPES,
  INFRA_CONFIG_SCOPES,
  INFRA_CONFIG_PROTOCOLS,
  INFRA_CONFIG_DASHBOARD_URLS,
  INFRA_TYPE_ICON_NAME,
} from '../constants/infra-common';

export const InfraConfigTypes = {
  types: INFRA_CONFIG_TYPES,
  scopes: INFRA_CONFIG_SCOPES,
  protocols: INFRA_CONFIG_PROTOCOLS,
  dashboardUrls: INFRA_CONFIG_DASHBOARD_URLS,
  shortNameToTypes: _.toPairs(INFRA_CONFIG_TYPES)
    .map(([k, v]) => ({ [v.codeName]: k }))
    .reduce((r, pair) => Object.assign(r, pair), {}),
  typesIconClassNames: INFRA_TYPE_ICON_NAME,

  createPropTypes(PropTypes) {
    const propTypes = _.toPairs(this.types)
      .reduce((r, [key, item]) => Object.assign(r, {
        [key]: PropTypes.shape({
          idcs: PropTypes.objectOf(PropTypes.objectOf(item.propType(PropTypes))),
          clusters: PropTypes.objectOf(PropTypes.objectOf(item.propType(PropTypes))),
        }),
      }), {});
    return PropTypes.shape(propTypes);
  },

  findByKey(key) {
    return this.types[key];
  },

  findByShortName(name) {
    return this.findByKey(this.shortNameToTypes[name]);
  },

  findProtocol(infraType, infraProtocol) {
    const key = this.types[infraType] ? infraType : this.shortNameToTypes[infraType];
    return this.protocols[key][infraProtocol] || {};
  },

  findTypeIconClassName(key) {
    const infraTypeKey = this.types[key] ? key : this.shortNameToTypes[key];
    // The key may be protocol name also
    return this.typesIconClassNames[infraTypeKey || key];
  },
};

/* encode username and password */
function patchUrl(url) {
  const regex = /^([\w\\+]+:\/\/)(?:([^:/]*)(?:(:)(.*))?(@))?(.*)$/;
  return url.replace(regex, (match, scheme, username, sep, password, at, extra) => {
    const parts = [scheme];
    if (username) {
      parts.push(encodeURIComponent(username));
    }
    if (sep) {
      parts.push(sep);
    }
    if (password) {
      parts.push(encodeURIComponent(password));
    }
    if (at) {
      parts.push(at);
    }
    if (extra) {
      parts.push(extra);
    }
    return parts.join('');
  });
}


export class InfraConfigItem {
  constructor(scopeType, scopeName, infraType, infraName, value) {
    this.scopeType = scopeType;
    this.scopeName = scopeName;
    this.infraType = infraType;
    this.infraName = infraName;
    this.value = value;
  }

  static fromNestedData(data) {
    const items = [];
    // I hate this schema
    _.toPairs(data).forEach(([infraType, infraBook]) => {
      _.toPairs(infraBook).forEach(([scopeType, scopeBook]) => {
        _.toPairs(scopeBook).forEach(([scopeName, valueBook]) => {
          _.toPairs(valueBook).forEach(([infraName, value]) => {
            const item = new InfraConfigItem(
              scopeType, scopeName, infraType, infraName, value,
            );
            items.push(item);
          });
        });
      });
    });
    return _.sortBy(items, ['infraType', 'infraName']);
  }

  get uniqueKey() {
    return `${this.scopeType}#${this.scopeName}#${this.infraType}#${this.infraName}`;
  }

  get richInfraType() {
    return InfraConfigTypes.findByKey(this.infraType);
  }

  get isClusterScope() {
    return this.scopeType === INFRA_CONFIG_SCOPES.CLUSTER_SCOPE;
  }

  get infraProtocol() {
    const { infraProtocol } = Object.values(this.getUrlMap())[0] || {};
    return infraProtocol;
  }

  get richInfraProtocol() {
    return InfraConfigTypes.findProtocol(this.infraType, this.infraProtocol);
  }

  matchAnchor({ infraType, infraName }) {
    return (
      infraType === this.richInfraType.codeName
      && infraName === this.infraName);
  }

  getUrlMap() {
    if (this.value && this.richInfraType) {
      const { urlAttributes, urlParser } = this.richInfraType;
      return urlAttributes
        .map(name => [name, this.value[name]])
        .filter(([, url]) => url)
        .map(([name, url]) => [name, url, urlParser(new URL(patchUrl(url)))])
        .reduce((r, [name, url, params]) => Object.assign({}, r, {
          [name]: Object.assign({}, params, { url }),
        }), {});
    }
    return {};
  }
}
