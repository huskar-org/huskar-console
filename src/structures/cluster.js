import Immutable from 'immutable';
import _ from 'lodash';
import { EZONE_IDS, EZONE_GLOBAL } from '../constants/ezone';
import { EZONE_LIST } from '../constants/env';

const ClusterBase = Immutable.Record({
  ezone: EZONE_GLOBAL,
  clusterName: '',
});
const EZONE_IDS_WITH_GLOBAL = Object.assign(
  {}, EZONE_IDS, { global: EZONE_GLOBAL },
);

function dedupleft(fragments, marker) {
  return _.dropWhile(fragments, x => x === marker).join('-');
}

export default class Cluster extends ClusterBase {
  toString() {
    if (this.isGlobal) {
      return this.clusterName;
    }
    return `${this.ezone.name}-${this.clusterName}`;
  }

  get isGlobal() {
    return this.ezone.name === null;
  }

  get isEmpty() {
    return this.isGlobal && this.clusterName === '';
  }

  static parse(clusterName) {
    if (clusterName instanceof Cluster) {
      return clusterName;
    }
    const fragments = clusterName.split('-');
    const ezone = EZONE_IDS[fragments[0]];

    if (
      ezone === undefined || fragments.length === 1
      || EZONE_LIST.indexOf(ezone.name) === -1
    ) {
      // Global cluster label
      return new Cluster({ clusterName });
    }

    return new Cluster({
      ezone,
      clusterName: dedupleft(fragments, ezone.name),
    });
  }

  static getZoneList() {
    return EZONE_LIST
      .map(name => EZONE_IDS_WITH_GLOBAL[name])
      .filter(zone => zone);
  }

  static getZone(name) {
    return name ? EZONE_IDS[name] : EZONE_GLOBAL;
  }

  normalize() {
    return Cluster.parse(this.toString());
  }
}
