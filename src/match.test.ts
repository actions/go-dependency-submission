import { PackageURL } from 'packageurl-js'
import { PackageCache } from '@github/dependency-submission-toolkit'

import { findMatchingPackage } from './match'

describe('findMatchingPackage', () => {
  test('disambiguates packages that share a name but have different namespaces', () => {
    const cache = new PackageCache()
    cache.package('pkg:golang/cloud.google.com/go@v0.116.0')
    cache.package('pkg:golang/github.com/json-iterator/go@v1.1.12')

    const childPkg = PackageURL.fromString(
      'pkg:golang/github.com/json-iterator/go@v1.1.12'
    )

    const match = findMatchingPackage(cache, childPkg)

    expect(match).not.toBeUndefined()
    expect(match?.packageURL.toString()).toEqual(
      'pkg:golang/github.com/json-iterator/go@v1.1.12'
    )
  })

  test('matches a bare-name package against a cache containing other packages with the same name', () => {
    /* Reproduces the bug: when the child package has no namespace
     * (PackageURL.namespace === null), packagesMatching previously matched
     * any cached package with the same name, returning multiple matches
     * for cached packages like cloud.google.com/go and json-iterator/go. */
    const cache = new PackageCache()
    cache.package('pkg:golang/cloud.google.com/go@v0.116.0')
    cache.package('pkg:golang/github.com/json-iterator/go@v1.1.12')
    cache.package('pkg:golang/go@v1.0.0')

    const childPkg = PackageURL.fromString('pkg:golang/go@v1.0.0')

    const match = findMatchingPackage(cache, childPkg)

    expect(match?.packageURL.toString()).toEqual('pkg:golang/go@v1.0.0')
  })

  test('returns the only package with the same namespace+name', () => {
    const cache = new PackageCache()
    cache.package('pkg:golang/github.com/fatih/color@v1.13.0')

    const childPkg = PackageURL.fromString(
      'pkg:golang/github.com/fatih/color@v1.13.0'
    )

    const match = findMatchingPackage(cache, childPkg)

    expect(match?.packageURL.toString()).toEqual(
      'pkg:golang/github.com/fatih/color@v1.13.0'
    )
  })

  test('returns undefined when no package matches', () => {
    const cache = new PackageCache()
    cache.package('pkg:golang/github.com/fatih/color@v1.13.0')

    const childPkg = PackageURL.fromString(
      'pkg:golang/github.com/missing/pkg@v1.0.0'
    )

    expect(findMatchingPackage(cache, childPkg)).toBeUndefined()
  })
})
