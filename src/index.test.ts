import { getDefaultSnapshotDetector } from './detector'

const packageJson = require('../package.json') as {
  version: string
}

describe('default snapshot detector', () => {
  test('version matches project version', () => {
    expect(getDefaultSnapshotDetector().version).toEqual(packageJson.version)
  })
})
