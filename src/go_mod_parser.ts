import {
  Entry,
  ParsedDependencies
} from '@github/dependency-submission-toolkit/dist/processor'

export function parseDependents (contents: string) {
  const stdoutArr: string[] = contents.split('\n')
  const splitStdoutArr: string[][] = stdoutArr.map(function (line) {
    return line.split(' ')
  })

  const entries: ParsedDependencies = {}
  const repoName = splitStdoutArr[0][0]
  splitStdoutArr.forEach((line: string[]) => {
    if (line === undefined || line.length < 2) return // skip empty lines

    let targetEntry: Entry
    const targetPkg = `pkg:golang/${line[0]}`
    let dependencyEntry: Entry
    const dependencyPkg = `pkg:golang/${line[1]}`

    const matchFound = line[0].match(repoName)
    if (matchFound && matchFound.index != null) {
      entries[dependencyPkg] = new Entry(dependencyPkg, 'direct')
      return
    }

    if (targetPkg in entries) {
      targetEntry = entries[targetPkg]
    } else {
      targetEntry = new Entry(targetPkg, 'indirect')
      entries[targetPkg] = targetEntry
    }

    if (dependencyPkg in entries) {
      dependencyEntry = entries[dependencyPkg]
    } else {
      dependencyEntry = new Entry(dependencyPkg, 'indirect')
      entries[dependencyPkg] = dependencyEntry
    }

    targetEntry.addDependency(dependencyEntry)
  })
  return entries
}
