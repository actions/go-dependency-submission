import { PackageURL } from 'packageurl-js'
import { Package, PackageCache } from '@github/dependency-submission-toolkit'

/**
 * Finds the package in the cache that matches the given child PURL on both
 * name and namespace. Treats null and undefined namespaces as equivalent so
 * Go modules sharing a name (e.g. those ending in /go) are disambiguated.
 */
export function findMatchingPackage (
  cache: PackageCache,
  childPkg: PackageURL
): Package | undefined {
  const matches = cache
    .packagesMatching({ name: childPkg.name })
    .filter(
      (p) => (p.packageURL.namespace ?? null) === (childPkg.namespace ?? null)
    )

  if (matches.length === 0) return undefined

  if (matches.length !== 1) {
    throw new Error(
      'assertion failed: expected no more than one package in cache with namespace+name. ' +
        'Found: ' +
        JSON.stringify(matches) +
        ' for ' +
        JSON.stringify({
          name: childPkg.name,
          namespace: childPkg.namespace
        })
    )
  }

  return matches[0]
}
