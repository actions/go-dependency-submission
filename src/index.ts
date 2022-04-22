import * as core from '@actions/core'
import { run } from '@github/dependency-snapshot-action'
import {
  Entry,
  ParsedDependencies,
  ProcessDependenciesContent
} from '@github/dependency-snapshot-action/dist/processor'

let parseDependents: ProcessDependenciesContent

// eslint-disable-next-line prefer-const
parseDependents = function (contents: string) {
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

// Set the detector information provided from the action workflow input
const detector = {
  name: core.getInput('detector-name'),
  url: core.getInput('detector-url'),
  version: core.getInput('detector-version')
}

// If provided, set the metadata provided from the action workflow input
const metadataInput = core.getInput('metadata')

if (metadataInput === undefined) {
  run(parseDependents, { command: 'go mod graph' }, { detector })
} else {
  const metadata = JSON.parse(metadataInput)
  run(parseDependents, { command: 'go mod graph' }, { metadata, detector })
}
