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
  const goModPath = path.normalize(core.getInput('go-mod-path', { required: true}))

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
  // no file path if using the pseudotargets "all" or "./..."
  const filepath =
    goBuildTarget === 'all' || goBuildTarget === './...'
      ? undefined
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

  const snapshot = new Snapshot(
    {
      name: 'actions/go-dependency-submission',
      url: 'https://github.com/actions/go-dependency-submission',
      version: '0.0.1'
    },
    github.context,
    {
      correlator: `${github.context.job}-${goBuildTarget}`,
      id: github.context.runId.toString()
    }
  )
  snapshot.addManifest(manifest)
  submitSnapshot(snapshot)
}

main()
