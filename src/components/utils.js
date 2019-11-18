import PropTypes from 'prop-types';
import ip from 'ip';
import _ from 'lodash';
import { NETWORK_SEGMENT } from '../constants/ezone';
import { OVERALL_CLUSTER, RESERVED_CLUSTER_NAME } from '../constants/common';

export function valueShape(shapeTypes) {
  const checker = PropTypes.arrayOf(PropTypes.shape(shapeTypes));
  function validate(props, propName, componentName, location, propFullName) {
    const propValue = props[propName];
    return checker({
      [propName]: _.values(propValue),
    }, propName, componentName, location, propFullName);
  }
  return validate;
}

export function parseData(data) {
  try {
    return JSON.parse(data);
  } catch (error) {
    return { error };
  }
}

export function isReservedClusterName(clusterName, excludeOverall = true) {
  return (excludeOverall ? clusterName !== OVERALL_CLUSTER : true)
    && RESERVED_CLUSTER_NAME.indexOf(clusterName) !== -1;
}

export function isMultiplexRouting(clusterPhysicalName) {
  return (clusterPhysicalName || '').split('+').length > 1;
}

export function handlePressEnterKey(handler) {
  return (event) => {
    if (event.key === 'Enter') {
      return handler(event);
    }
    return undefined;
  };
}

export function getIDC(instanceIP) {
  try {
    for (let d = 0; d < NETWORK_SEGMENT.length; d += 1) {
      if (NETWORK_SEGMENT[d]
        .segment.filter(i => ip.cidrSubnet(i).contains(instanceIP)).length > 0) {
        return NETWORK_SEGMENT[d].name;
      }
    }
  } catch (error) {
    return null;
  }
  return null;
}
