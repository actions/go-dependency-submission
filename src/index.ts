import * as core from "@actions/core";
import { run } from "@github/dependency-submission-toolkit";
import { ProcessDependenciesContent } from "@github/dependency-submission-toolkit/dist/processor";
import { parseDependents } from "./go_mod_parser";
import * as path from "path";
import * as process from "process";
import execa from "execa";

const parseDependentsFunc: ProcessDependenciesContent = parseDependents;

// Set the detector information provided from the action workflow input
const detector = {
  name: core.getInput("detector-name"),
  url: core.getInput("detector-url"),
  version: core.getInput("detector-version"),
};

async function searchForFile(filename: string) {
  console.log(`searching for ${filename} in ${process.cwd()}`);

  const { stdout } = await execa("find", [process.cwd(), "-name", filename]);

  const dirs = stdout
    .split("\n")
    .filter((s) => s.length > 0)
    // remove the file name
    .map((filename) => path.dirname(filename))
    // map to absolute path
    .map((pathname) => path.resolve(process.cwd(), pathname));

  return dirs;
}

// Enumerate directories
async function detect() {
  const goModPaths = await searchForFile("go.mod");

  // If provided, set the metadata provided from the action workflow input
  const metadataInput = core.getInput("metadata");

  goModPaths.forEach((path) => {
    process.chdir(path);
    console.log(`Running go mod graph in ${path}`);
    if (metadataInput.length < 1) {
      run(parseDependentsFunc, { command: "go mod graph" }, { detector });
    } else {
      const metadata = JSON.parse(metadataInput);
      run(
        parseDependentsFunc,
        { command: "go mod graph" },
        { metadata, detector }
      );
    }
  });
}

detect();
