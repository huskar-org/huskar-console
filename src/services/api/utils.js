import URL from 'url-parse';
import PathInfo from '../../structures/path-info';

export default function pickErrorMessage(response) {
  let message;
  try {
    const { data } = response;
    message = data.message || data.status;
    if (!message) {
      message = 'Internal server error occurred';
    }
  } catch (e) {
    message = 'Unknown error occurred';
  }
  return message;
}

export function parseApiPath(url, data, applicationApiGroup, switchApiGroup, clusterApiGroup) {
  const parsedUrl = new URL(url, true);
  const path = parsedUrl.pathname;
  const { query } = parsedUrl;

  let applicationName = null;
  const applicationRegex = applicationApiGroup.inPath.find(api => api.exec(path));
  if (applicationRegex !== undefined) {
    [, applicationName] = applicationRegex.exec(path);
  } else {
    const item = Object.entries(applicationApiGroup.inQuery).find(
      pair => pair[1].some(r => r.exec(path)),
    );
    if (item) {
      const paramName = item[0];
      const value = query[paramName];
      if (value) {
        applicationName = value;
      }
    }
    if (!applicationName && data instanceof FormData) {
      const match = Object.entries(applicationApiGroup.inFormData).find(
        pair => pair[1].some(r => r.exec(path)),
      );
      if (match) {
        const value = data.get(match[0]);
        if (value) {
          applicationName = value;
        }
      }
    }
  }

  let operationType = null;
  const switchRegex = switchApiGroup.inPath.find(api => api.exec(path));
  if (switchRegex) {
    operationType = 'switch';
  }
  let operationCluster = null;
  const clusterRegex = clusterApiGroup.inPath.find(api => api.exec(path));
  if (clusterRegex) {
    [, operationCluster] = clusterRegex.exec(path);
  } else {
    const item = Object.entries(clusterApiGroup.inQuery).find(
      pair => pair[1].some(r => r.exec(path)),
    );
    if (item) {
      const paramName = item[0];
      const value = query[paramName];
      if (value) {
        operationCluster = value;
      }
    }
  }

  return PathInfo.parse({ operationApplication: applicationName, operationType, operationCluster });
}
