import fs from 'fs'
import path from 'path'

import { getDefaultSnapshotDetector, getProjectVersion } from './index'

describe('default snapshot detector', () => {
  test('version matches project version', () => {
    const packageJsonPath = path.resolve(__dirname, '..', 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
      version: string
    }

    expect(getProjectVersion()).toEqual(packageJson.version)
    expect(getDefaultSnapshotDetector().version).toEqual(packageJson.version)
  })
})
