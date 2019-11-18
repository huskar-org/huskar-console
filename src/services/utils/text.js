export function isLongTextFragment(text) {
  return text && (text.indexOf('\n') !== -1 || text.indexOf('\r') !== -1 || text.length > 128);
}

export function isJSON(text) {
  if (!text) {
    return false;
  }
  try {
    JSON.parse(text);
  } catch (e) {
    return false;
  }
  return true;
}

export function isLikeJSON(text) {
  const value = (text || '').trim();
  return (
    (value.startsWith('{') && value.endsWith('}'))
    || (value.startsWith('[') && value.endsWith(']'))
  );
}
