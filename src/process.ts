import { PackageURL } from 'packageurl-js'

import * as exec from '@actions/exec'
import * as core from '@actions/core'
import { PackageCache } from '@github/dependency-submission-toolkit'

import { parseGoModGraph, parseGoList } from './parse'
import { findMatchingPackage } from './match'

export async function processGoGraph (
  goModDir: string,
  directDependencies: Array<PackageURL>,
  indirectDependencies: Array<PackageURL>
): Promise<PackageCache> {
  console.log(`Running 'go mod graph' in ${goModDir}`)
  const goModGraph = await exec.getExecOutput('go', ['mod', 'graph'], {
    cwd: goModDir
  })
  if (goModGraph.exitCode !== 0) {
    core.error(goModGraph.stderr)
    core.setFailed("'go mod graph' failed!")
    throw new Error("Failed to execute 'go mod graph'")
  }

  /* add all direct and indirect packages to a new PackageCache */
  const cache = new PackageCache()
  directDependencies.forEach((pkg) => {
    cache.package(pkg)
  })
  indirectDependencies.forEach((pkg) => {
    cache.package(pkg)
  })

  const packageAssocList = parseGoModGraph(goModGraph.stdout)
  packageAssocList.forEach(([parentPkg, childPkg]) => {
    /* Look up the parent package in the cache. go mod graph will return
     * multiple versions of packages with the same namespace and name. We
     * select only package versions used in the Go build target. */
    const targetPackage = cache.lookupPackage(parentPkg)
    if (!targetPackage) return

    /* Look up the child package in the cache by namespace+name. The child
     * version specified by go mod graph is not guaranteed to be the one
     * selected when building Go build targets, so we match on
     * namespace+name (which uniquely identifies a Go module). */
    const match = findMatchingPackage(cache, childPkg)
    if (!match) return

    // create the dependency relationship
    targetPackage.dependsOn(match)
  })

  return cache
}

// For a specific Go _build target_, these templates list dependencies used to
// in the build target. It does not provide association between the
// dependencies (i.e. which dependencies depend on which)
// eslint-disable-next-line quotes
// eslint-disable-next-line no-useless-escape
const GO_DIRECT_DEPS_TEMPLATE =
  '{{define "M"}}{{if not .Indirect}}{{.Path}}@{{.Version}}{{end}}{{end}}{{with .Module}}{{if not .Main}}{{if .Replace}}{{template "M" .Replace}}{{else}}{{template "M" .}}{{end}}{{end}}{{end}}'
// eslint-disable-next-line quotes
// eslint-disable-next-line no-useless-escape
const GO_INDIRECT_DEPS_TEMPLATE =
  '{{define "M"}}{{if .Indirect}}{{.Path}}@{{.Version}}{{end}}{{end}}{{with .Module}}{{if not .Main}}{{if .Replace}}{{template "M" .Replace}}{{else}}{{template "M" .}}{{end}}{{end}}{{end}}'

export async function processGoDirectDependencies (
  goModDir: string,
  goBuildTarget: string
): Promise<Array<PackageURL>> {
  console.log(
    `go direct package detection in ${goModDir} on build target ${goBuildTarget}`
  )
  return processGoList(goModDir, goBuildTarget, GO_DIRECT_DEPS_TEMPLATE)
}

export async function processGoIndirectDependencies (
  goModDir: string,
  goBuildTarget: string
): Promise<Array<PackageURL>> {
  console.log(
    `go indirect package detection in ${goModDir} on build target ${goBuildTarget}`
  )
  return processGoList(goModDir, goBuildTarget, GO_INDIRECT_DEPS_TEMPLATE)
}

async function processGoList (
  goModDir: string,
  goBuildTarget: string,
  goListTemplate: string
): Promise<Array<PackageURL>> {
  const goList = await exec.getExecOutput(
    'go',
    ['list', '-deps', '-f', goListTemplate, goBuildTarget],
    { cwd: goModDir }
  )
  if (goList.exitCode !== 0) {
    core.error(goList.stderr)
    core.setFailed("'go list' failed!")
    throw new Error("Failed to execute 'go list'")
  }

  return parseGoList(goList.stdout)
}
