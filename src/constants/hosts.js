export const DEPLOYMENT_HOSTS = [
  {
    name: 'beta',
    pattern: /^huskar\.beta\.example\.com$/,
  },
  {
    name: 'beta',
    pattern: /^huskar\.alt[a-z]\.example\.com$/,
  },
];

export const DEPLOYMENT_LINKS = [
  { name: 'beta', href: 'https://huskar.beta.example.com' },
];

export const DEPLOYMENT_ABBRS = [
  { name: 'alpha', abbr: 'α' },
  { name: 'beta', abbr: 'β' },
];

const host = DEPLOYMENT_HOSTS
  .find(r => r.pattern.exec(window.location.hostname));
export const stageName = host ? host.name : 'self-host';
