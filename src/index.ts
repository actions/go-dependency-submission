import path from 'path'
import fs from 'fs'
import * as core from '@actions/core'
import * as github from '@actions/github'
import {
  Snapshot,
  Manifest,
  submitSnapshot
} from '@github/dependency-submission-toolkit'

import {
  processGoGraph,
  processGoDirectDependencies,
  processGoIndirectDependencies
} from './process'

async function main () {
  const goModPath = path.normalize(
    core.getInput('go-mod-path', { required: true })
  )

  if (path.basename(goModPath) !== 'go.mod' || !fs.existsSync(goModPath)) {
    throw new Error(`${goModPath} is not a go.mod file or does not exist!`)
  }
  const goModDir = path.dirname(goModPath)

  let goBuildTarget = core.getInput('go-build-target')

  if (goBuildTarget !== 'all' && goBuildTarget !== './...') {
    if (!fs.existsSync(goBuildTarget)) {
      throw new Error(`The build target '${goBuildTarget}' does not exist`)
    }
    if (goModDir !== '.') {
      if (goBuildTarget.startsWith(goModDir)) {
        goBuildTarget = goBuildTarget.replace(goModDir, '')
        goBuildTarget = goBuildTarget.startsWith('/')
          ? goBuildTarget.substring(1)
          : goBuildTarget
      } else {
        throw new Error(
          `The build target ${goBuildTarget} is not a sub-directory of ${goModDir}`
        )
      }
    }
  }

  const directDeps = await processGoDirectDependencies(goModDir, goBuildTarget)
  const indirectDeps = await processGoIndirectDependencies(
    goModDir,
    goBuildTarget
  )
  const packageCache = await processGoGraph(goModDir, directDeps, indirectDeps)
  // if using the pseudotargets "all" or "./...", use the path to go.mod as filepath
  const filepath =
    goBuildTarget === 'all' || goBuildTarget === './...'
      ? goModPath
      : path.join(goModDir, goBuildTarget)
  const manifest = new Manifest(goBuildTarget, filepath)

  directDeps.forEach((pkgUrl) => {
    const dep = packageCache.lookupPackage(pkgUrl)
    if (!dep) {
      throw new Error(
        'assertion failed: expected all direct dependencies to have entries in PackageCache'
      )
    }
    manifest.addDirectDependency(dep)
  })

  indirectDeps.forEach((pkgUrl) => {
    const dep = packageCache.lookupPackage(pkgUrl)
    if (!dep) {
      throw new Error(
        'assertion failed: expected all indirect dependencies to have entries in PackageCache'
      )
    }
    manifest.addIndirectDependency(dep)
  })

  type SnapshotDetector = {
    name: string
    url: string
    version: string
  }
  let snapshotDetector: SnapshotDetector

  const detectorName = core.getInput('detector-name')
  const detectorUrl = core.getInput('detector-url')
  const detectorVersion = core.getInput('detector-version')

  if (detectorName === '' && detectorUrl === '' && detectorVersion === '') {
    // use defaults if none are specified
    snapshotDetector = {
      name: 'actions/go-dependency-submission',
      url: 'https://github.com/actions/go-dependency-submission',
      version: '0.0.1'
    }
  } else if (
    detectorName === '' ||
    detectorUrl === '' ||
    detectorVersion === ''
  ) {
    // if any of detectorName, detectorUrl, or detectorVersion have value, then they are all required
    throw new Error(
      "Invalid input: if any of 'detector-name', 'detector-url', or 'detector-version' have value, then thay are all required."
    )
  } else {
    // use inputs since all are specified
    snapshotDetector = {
      name: detectorName,
      url: core.getInput('detector-url', { required: true }),
      version: core.getInput('detector-version', { required: true })
    }
  }

  const snapshot = new Snapshot(snapshotDetector, github.context, {
    correlator: `${github.context.job}-${goBuildTarget}`,
    id: github.context.runId.toString()
  })
  snapshot.addManifest(manifest)

  // only override the sha if the input has a value
  // otherwise, continue to use the sha set from the context in the Snapshot constructor
  const inputSHA = core.getInput('sha')
  if (inputSHA !== '') {
    snapshot.sha = inputSHA
  }

  // only override the ref if the input has a value
  // otherwise, continue to use the ref set from the context in the Snapshot constructor
  const inputRef = core.getInput('ref')
  if (inputRef !== '') {
    snapshot.ref = inputRef
  }

  submitSnapshot(snapshot)
}

main()
