import {
  Entry,
  ParsedDependencies
} from '@github/dependency-submission-toolkit/dist/processor'

import path from 'path'

// processes a list of go dependencies, one dependency per line, matching the
// format "${GO_PACKAGE}@v{VERSION}"
export function parseDependents (contents: string) {
  // split the input by newlines, sort, and dedup
  const packages: string[] = Array.from(
    new Set(
      contents
        .split('\n')
        .map((p) => p.trim())
        .sort()
    )
  )

  const entries: ParsedDependencies = {}
  packages.forEach((pkg: string) => {
    if (!pkg) return
    const [qualifiedPackage, version] = pkg.split('@')
    // URI-encode slashes in the namespace
    const namespace = encodeURIComponent(path.dirname(qualifiedPackage))
    const name = path.basename(qualifiedPackage)
    const targetPkg = `pkg:golang/${namespace}/${name}@${version}`
    entries[targetPkg] = new Entry(targetPkg)
  })
  return entries
}
