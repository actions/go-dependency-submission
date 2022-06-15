import path from 'path'
import fs from 'fs'

import * as core from '@actions/core'
import * as github from '@actions/github'
import { Snapshot, submitSnapshot } from '@github/dependency-submission-toolkit'

import { processGoGraph, processGoBuildTarget } from './process'

async function main () {
  const goModPath = path.normalize(core.getInput('go-mod-path'))

  if (path.basename(goModPath) !== 'go.mod' && fs.existsSync(goModPath)) {
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

  const packageCache = await processGoGraph(goModDir)
  const manifest = await processGoBuildTarget(
    goModDir,
    goBuildTarget,
    packageCache
  )
  const snapshot = new Snapshot(
    {
      name: 'github-go-dependency-detector',
      url: 'https://github.com/github/github-go-dependency-detector',
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
