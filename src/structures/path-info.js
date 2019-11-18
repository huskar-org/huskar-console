import Immutable from 'immutable';

const PathInfoBase = Immutable.Record({
  operationApplication: null,
  operationType: null,
  operationCluster: null,
});


export default class PathInfo extends PathInfoBase {
  static parse(data) {
    if (Object.keys(data).length === 0) {
      return new PathInfoBase();
    }
    return new PathInfoBase({
      operationApplication: data.operationApplication,
      operationType: data.operationType,
      operationCluster: data.operationCluster,
    });
  }
}
