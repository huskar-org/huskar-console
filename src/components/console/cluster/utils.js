import { Cluster } from '../../../structures';

export default function dumpRouteForExport(
  { type, fromApplicationName, fromClusterName, intent, applicationName, clusterName },
) {
  return {
    type,
    from_application_name: fromApplicationName,
    from_cluster_name: fromClusterName,
    intent,
    application_name: applicationName,
    cluster_name: Cluster.parse(clusterName).clusterName,
  };
}
