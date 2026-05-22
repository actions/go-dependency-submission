const packageJson = require('../package.json') as {
  version?: string
}

function getProjectVersion (): string {
  if (typeof packageJson.version !== 'string' || packageJson.version === '') {
    throw new Error('Invalid package version in package.json')
  }

  return packageJson.version
}

export function getDefaultSnapshotDetector (): {
  name: string
  url: string
  version: string
} {
  return {
    name: 'actions/go-dependency-submission',
    url: 'https://github.com/actions/go-dependency-submission',
    version: getProjectVersion()
  }
}

