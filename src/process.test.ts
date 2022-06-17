import {
  processGoGraph,
  processGoDirectDependencies,
  processGoIndirectDependencies
} from './process'

// NOTE: these tests all require "go" to be installed and available on the PATH!
//
describe('processGoDirectDependencies', () => {
  test('run in go-example', async () => {
    const purls = await processGoDirectDependencies(
      'go-example',
      'cmd/octocat.go'
    )
    expect(purls).toHaveLength(1)
    expect(purls).toEqual([
      {
        type: 'golang',
        name: 'color',
        namespace: 'github.com/fatih',
        version: 'v1.13.0',
        qualifiers: null,
        subpath: null
      }
    ])
  })
})

describe('processGoIndirectDependencies', () => {
  test('run in go-example', async () => {
    const purls = await processGoIndirectDependencies(
      'go-example',
      'cmd/octocat.go'
    )
    expect(purls).toHaveLength(3)
    expect(purls).toEqual([
      {
        type: 'golang',
        name: 'sys',
        namespace: 'golang.org/x',
        version: 'v0.0.0-20210630005230-0f9fa26af87c',
        qualifiers: null,
        subpath: null
      },
      {
        type: 'golang',
        name: 'go-isatty',
        namespace: 'github.com/mattn',
        version: 'v0.0.14',
        qualifiers: null,
        subpath: null
      },
      {
        type: 'golang',
        name: 'go-colorable',
        namespace: 'github.com/mattn',
        version: 'v0.1.9',
        qualifiers: null,
        subpath: null
      }
    ])
  })
})

describe('processGoGraph', () => {
  test.only('run in go-example', async () => {
    const directDeps = await processGoDirectDependencies(
      'go-example',
      'cmd/octocat.go'
    )
    const indirectDeps = await processGoIndirectDependencies(
      'go-example',
      'cmd/octocat.go'
    )
    const cache = await processGoGraph('go-example', directDeps, indirectDeps)

    // we expect the number of direct dependencies + indirect
    expect(cache.countPackages()).toEqual(4)

    const colorDep = cache.lookupPackage(
      'pkg:golang/github.com/fatih/color@v1.13.0'
    )
    expect(colorDep).not.toBeUndefined()
    if (colorDep) expect(colorDep.dependencies).toHaveLength(2)
  })
})
