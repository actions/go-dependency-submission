import * as path from 'path'
import * as process from 'process'
import fs from 'fs'

import * as exec from '@actions/exec'
import * as core from '@actions/core'
import {
  Manifest,
  BuildTarget,
  PackageCache,
  Snapshot,
  submitSnapshot
} from '@github/dependency-submission-toolkit'

import { parseGoList, parseGoModGraph } from './parse-go-package'

// Set the detector information provided from the action workflow input
const detector = {
  name: core.getInput('detector-name'),
  url: core.getInput('detector-url'),
  version: core.getInput('detector-version')
}

async function main() {
  const goModPath = path.normalize(core.getInput('go-mod-path'))

  if (path.basename(goModPath) !== 'go.mod' && fs.existsSync(goModPath)) {
    throw new Error(`${goModPath} is not a go.mod file or does not exist!`)
  }
  const goModDir = path.dirname(goModPath)

  let goBuildTarget = path.normalize(core.getInput('go-build-target'))

  if (goBuildTarget !== 'all' && goBuildTarget !== '...') {
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
  const manifest = await processGoTarget(goModDir, goBuildTarget, packageCache)
  const snapshot = new Snapshot({
    name: 'github-go-dependency-detector',
    url: 'https://github.com/github/github-go-dependency-detector',
    version: '0.0.1'
  })
  snapshot.addManifest(manifest)
  submitSnapshot(snapshot)
}

async function processGoGraph(goModDir: string): Promise<PackageCache> {
  console.log(`Running 'go mod graph' in ${goModDir}`)
  const goModGraph = await exec.getExecOutput('go', ['mod', 'graph'], {
    cwd: goModDir
  })
  if (goModGraph.exitCode !== 0) {
    core.error(goModGraph.stderr)
    core.setFailed("'go mod graph' failed!")
    throw new Error("Failed to execute 'go mod graph'")
  }
  const cache = new PackageCache()
  const packageAssocList = parseGoModGraph(goModGraph.stdout)
  packageAssocList.forEach(([parentPkg, childPkg]) => {
    cache.package(parentPkg).dependsOn(cache.package(childPkg))
  })
  return cache
}

// For a specific Go _build target_, this template lists all dependencies used
// to build the build target It does not provide association between the
// dependencies (i.e. which dependencies depend on which)
// eslint-disable-next-line quotes
// eslint-disable-next-line no-useless-escape
const goListDependencyTemplate =
  '"{{define \\"M\\"}}{{.Path}}@{{.Version}}{{end}}{{with .Module}}{{if not .Main}}{{if .Replace}}{{template \\"M\\" .Replace}}{{else}}{{template \\"M\\" .}}{{end}}{{end}}{{end}}"'
async function processGoTarget(
  goModDir: string,
  goBuildTarget: string,
  cache: PackageCache
): Promise<Manifest> {
  console.log(
    `Running go package detection in ${goModDir} on build target ${goBuildTarget}`
  )

  const goList = await exec.getExecOutput(
    'go',
    ['list', '-deps', '-f', goListDependencyTemplate, goBuildTarget],
    { cwd: goModDir }
  )
  if (goList.exitCode !== 0) {
    core.error(goList.stderr)
    core.setFailed("'go list' failed!")
    throw new Error("Failed to execute 'go list'")
  }

  const dependencies = parseGoList(goList.stdout)
  const manifest = new BuildTarget(
    goBuildTarget,
    path.join(goModDir, goBuildTarget)
  )
  dependencies.forEach((dep) => {
    manifest.addBuildDependency(cache.package(dep))
  })
  return manifest
}

main()
