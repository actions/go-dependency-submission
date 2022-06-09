import path from 'path'

import * as exec from '@actions/exec'
import * as core from '@actions/core'
import {
  Manifest,
  BuildTarget,
  PackageCache
} from '@github/dependency-submission-toolkit'

import { parseGoModGraph, parseGoList } from './parse'

export async function processGoGraph (goModDir: string): Promise<PackageCache> {
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
const GO_LIST_DEP_TEMPLATE =
  '{{define "M"}}{{.Path}}@{{.Version}}{{end}}{{with .Module}}{{if not .Main}}{{if .Replace}}{{template "M" .Replace}}{{else}}{{template "M" .}}{{end}}{{end}}{{end}}'

export async function processGoBuildTarget (
  goModDir: string,
  goBuildTarget: string,
  cache: PackageCache
): Promise<Manifest> {
  console.log(
    `Running go package detection in ${goModDir} on build target ${goBuildTarget}`
  )

  const goList = await exec.getExecOutput(
    'go',
    ['list', '-deps', '-f', GO_LIST_DEP_TEMPLATE, goBuildTarget],
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
