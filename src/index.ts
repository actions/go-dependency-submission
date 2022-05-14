import * as core from '@actions/core'
import { run } from '@github/dependency-submission-toolkit'
import { ProcessDependenciesContent } from '@github/dependency-submission-toolkit/dist/processor'
import {
  Detector,
  Metadata
} from '@github/dependency-submission-toolkit/dist/snapshot'
import { parseDependents } from './parse-go-package'
import * as path from 'path'
import * as process from 'process'
import fs from 'fs'

const parseDependentsFunc: ProcessDependenciesContent = parseDependents

// Set the detector information provided from the action workflow input
const detector = {
  name: core.getInput('detector-name'),
  url: core.getInput('detector-url'),
  version: core.getInput('detector-version')
}

// For a specific Go _build target_, this commands lists all dependencies used
// to build the build target It does not provide association between the
// dependencies (i.e. which dependencies depend on which)
// eslint-disable-next-line quotes
const goListDependencies = `go list -deps -f '{{define "M"}}{{.Path}}@{{.Version}}{{end}}{{with .Module}}{{if not .Main}}{{if .Replace}}{{template "M" .Replace}}{{else}}{{template "M" .}}{{end}}{{end}}{{end}}'`

// Enumerate directories
async function detect () {
  // If provided, set the metadata provided from the action workflow input
  const goModPath = path.normalize(core.getInput('go-mod-path'))
  if (path.basename(goModPath) !== 'go.mod' && fs.existsSync(goModPath)) {
    throw new Error(`${goModPath} is not a go.mod file or does not exist!`)
  }
  const goModDir = path.dirname(goModPath)

  const goBuildTarget = path.normalize(core.getInput('go-build-target'))
  if (goBuildTarget !== 'all' && goBuildTarget !== '...') {
    if (!fs.existsSync(goBuildTarget)) {
      throw new Error(`The build target '${goBuildTarget}' does not exist`)
    }
    if (goModDir !== '.' && !goBuildTarget.startsWith(goModDir)) {
      throw new Error(
        `The build target ${goBuildTarget} is not a sub-directory of ${goModDir}`
      )
    }
  }

  const metadataInput = core.getInput('metadata')

  process.chdir(goModPath)
  console.log(
    `Running go package detection in ${path} on build target ${goBuildTarget}`
  )
  const options: { detector: Detector; metadata?: Metadata } = { detector }
  if (metadataInput) {
    const metadata = JSON.parse(metadataInput)
    options.metadata = metadata
  }
  run(
    parseDependentsFunc,
    { command: `${goListDependencies} ${goBuildTarget}` },
    options
  )
}

detect()
