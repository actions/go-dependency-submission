import { processGoGraph, processGoBuildTarget } from './process'

// NOTE: these tests all require "go" to be installed and available on the PATH!
//
describe('processGoGraph', () => {
  test('run in go-example', async () => {
    const cache = await processGoGraph('go-example')
    expect(cache.countPackages()).toEqual(8)
    const manifest = await processGoBuildTarget(
      'go-example',
      'cmd/octocat.go',
      cache
    )
    expect(manifest.directDependencies()).toHaveLength(4)
    expect(manifest.indirectDependencies()).toHaveLength(2)
  })
})
