import { setRequestHeaders, handleResponseHeaders } from './headers';

export default pathInfoParser => ({
  host: '/api',
  promise: Promise,
  http: request => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    // eslint-disable-next-line no-underscore-dangle
    xhr.__request = request;
    let { data } = request;
    let queryString = '';
    if (/GET/i.test(request.method) && data) {
      queryString = Object.keys(data)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
        .join('&');
      queryString = `?${queryString}`;
      data = null;
    }
    // I hate the API with this kind of style
    if (data && data.query && data.json) {
      queryString = Object.keys(data.query)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data.query[key])}`)
        .join('&');
      queryString = `?${queryString}`;
      data = JSON.stringify(data.json);
      xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
    }
    xhr.open(request.method, request.url + queryString);
    const token = localStorage.getItem('token');
    if (token) xhr.setRequestHeader('Authorization', token);
    setRequestHeaders(xhr, data, pathInfoParser);
    xhr.onload = () => {
      const mime = xhr.getResponseHeader('Content-Type') || 'json';
      let responseData = xhr.responseText;
      if (/\bjson\b/.test(mime)) {
        try {
          responseData = JSON.parse(responseData);
        } catch (error) {
          responseData = null;
        }
      }
      handleResponseHeaders(request.method, request.url, xhr);
      // always resolve, that easy to use 'await'
      resolve({ data: responseData, status: xhr.status, xhr });
    };
    xhr.onerror = () => {
      // eslint-disable-next-line prefer-promise-reject-errors
      reject({ data: null, status: 0, xhr });
    };
    if (data instanceof FormData || typeof data === 'string') {
      xhr.send(data);
    } else {
      const fd = new FormData();
      Object.keys(data || {}).forEach((key) => {
        fd.append(key, data[key]);
      });
      const value = JSON.parse(JSON.stringify(Object(data)));
      Object.defineProperty(fd, 'originalData', { value });
      xhr.send(fd);
    }
  }),
});
