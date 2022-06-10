import path from 'path'
import { PackageURL } from 'packageurl-js'

function parseGoPackage (pkg: string): PackageURL {
  const [qualifiedPackage, version] = pkg.split('@')
  const namespace = encodeURIComponent(path.dirname(qualifiedPackage))
  const name = path.basename(qualifiedPackage)
  return new PackageURL('golang', namespace, name, version ?? null, null, null)
}

/**
 * parseGoList parses a list of Go packages (one per line) matching the format
 * "${GO_PACKAGE}@v{VERSION}" into Package URLs. This expects the output of 'go
 * list -deps' as input.
 *
 * @param {string} contents
 * @returns {Array<PackageURL>}
 */
export function parseGoList (contents: string): Array<PackageURL> {
  // split the input by newlines, sort, and dedup
  const packages: string[] = Array.from(
    new Set(contents.split('\n').map((p) => p.trim()))
  )
  const purls: Array<PackageURL> = []
  packages.forEach((pkg: string) => {
    if (!pkg.trim()) return
    purls.push(parseGoPackage(pkg))
  })
  return purls
}

/**
 * parseGoModGraph parses an *associative list* of Go packages into tuples into
 * an associative list of PackageURLs. This expects the output of 'go mod
 * graph' as input
 */
export function parseGoModGraph (
  contents: string
): Array<[PackageURL, PackageURL]> {
  const pkgAssocList: Array<[PackageURL, PackageURL]> = []
  contents.split('\n').forEach((line) => {
    if (!line.trim()) return
    const [parentPkg, childPkg] = line.split(' ')
    pkgAssocList.push([parseGoPackage(parentPkg), parseGoPackage(childPkg)])
  })
  return pkgAssocList
}
