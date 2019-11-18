import URL from 'url-parse';

export default function validateRawUrl(infraProtocol, rawUrl) {
  const url = new URL(rawUrl);
  const protocol = url.protocol.slice(0, -1);
  const remainPart = rawUrl.slice(url.protocol.length, rawUrl.length);
  const { pathname } = url;
  // avoid unknown://
  // avoid jdbc:mysql://
  if (protocol !== infraProtocol) {
    return false;
  }

  // avoid mysql:
  // avoid mysql:mysql://
  if (!remainPart.startsWith('//')) {
    return false;
  }

  // avoid mysql://mysql://
  return pathname === '' || (pathname.startsWith('/') && !pathname.startsWith('//'));
}
