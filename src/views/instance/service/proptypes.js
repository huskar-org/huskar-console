import PropTypes from 'prop-types';

export const instanceValueShape = PropTypes.shape({
  ip: PropTypes.string,
  meta: PropTypes.objectOf(PropTypes.string),
  port: PropTypes.objectOf(PropTypes.number),
  state: PropTypes.oneOf(['up', 'down']),
});

export const instanceShape = PropTypes.shape({
  key: PropTypes.string,
  value: instanceValueShape,
  comment: PropTypes.string,
});

export const clusterMetaShape = PropTypes.shape({
  created: PropTypes.number,
  instanceCount: PropTypes.number,
  lastModified: PropTypes.number,
  version: PropTypes.number,
});

export const clusterRouteShape = PropTypes.shape({
  applicationName: PropTypes.string,
  clusterName: PropTypes.string,
  intent: PropTypes.string,
});

export const clusterShape = PropTypes.shape({
  name: PropTypes.string.isRequired,
  meta: clusterMetaShape,
  physicalName: PropTypes.string,
  route: PropTypes.arrayOf(clusterRouteShape),
});
