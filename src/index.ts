import * as core from '@actions/core'
import { run } from '@github/dependency-snapshot-action'
import { ProcessDependenciesContent } from '@github/dependency-snapshot-action/dist/processor'
import { parseDependents } from './go_mod_parser'

const parseDependentsFunc: ProcessDependenciesContent = parseDependents

// Set the detector information provided from the action workflow input
const detector = {
  name: core.getInput('detector-name'),
  url: core.getInput('detector-url'),
  version: core.getInput('detector-version')
}

// If provided, set the metadata provided from the action workflow input
const metadataInput = core.getInput('metadata')
if (metadataInput.length < 1) {
  run(parseDependentsFunc, { command: 'go mod graph' }, { detector })
} else {
  const metadata = JSON.parse(metadataInput)
  run(parseDependentsFunc, { command: 'go mod graph' }, { metadata, detector })
}
