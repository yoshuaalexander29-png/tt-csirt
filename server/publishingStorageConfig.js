import path from 'node:path';

export function defaultPublishingStorePath(rootDirectory, nodeEnvironment = process.env.NODE_ENV) {
  const filename = nodeEnvironment === 'production'
    ? 'published-advisories.json'
    : 'published-advisories.development.json';
  return path.join(rootDirectory, 'server', 'data', filename);
}
