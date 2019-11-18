import Immutable from 'immutable';

const WellKnownBase = Immutable.Record({
  frameworkVersions: {},
  idcList: [],
  ezoneList: [],
  routeDefaultHijackMode: {},
  forceRoutingClusters: {},
});


export default class WellKnownData extends WellKnownBase {
  static parse(data) {
    if (Object.keys(data).length === 0) {
      return new WellKnownData();
    }
    return new WellKnownData({
      frameworkVersions: data.framework_versions,
      idcList: data.idc_list,
      ezoneList: data.ezone_list,
      routeDefaultHijackMode: data.route_default_hijack_mode,
      forceRoutingClusters: data.force_routing_clusters,
    });
  }

  getLatestVersions() {
    const versions = this.get('frameworkVersions');
    return versions.latest || {};
  }

  getLatestJava() {
    const versions = this.getLatestVersions();
    return versions.java;
  }

  getLatestPython() {
    const versions = this.getLatestVersions();
    return versions.python;
  }

  getEzoneList() {
    return this.get('ezoneList') || [];
  }

  getIDCList() {
    return this.get('idcList') || [];
  }

  getRouteDefaultHijackMode(ezone) {
    return this.get('routeDefaultHijackMode')[ezone];
  }

  getForceRoutingClusters(forceCluster) {
    return this.get('forceRoutingClusters')[forceCluster];
  }
}
