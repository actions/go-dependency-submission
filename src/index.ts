import { run } from "@github/dependency-snapshot-action";
import {
  Entry,
  ParsedDependencies,
  ProcessDependenciesContent,
} from "@github/dependency-snapshot-action/dist/processor";

let parseDependents: ProcessDependenciesContent;

// eslint-disable-next-line prefer-const
parseDependents = function (contents: string) {
  const stdoutArr: string[] = contents.split("\n");
  const splitStdoutArr: string[][] = stdoutArr.map(function (line) {
    return line.split(" ");
  });

  const entries: ParsedDependencies = {};
  const repoName = splitStdoutArr[0][0];
  splitStdoutArr.forEach((line: string[]) => {
    if (line.length < 2 || line === undefined) return; // skip empty lines

    let entry: Entry;
    let dependencyString = `pkg:golang/${line[0]}`;

    const matchFound = line[0].match(repoName);
    if (matchFound && matchFound.index != null) {
      dependencyString = `pkg:golang/${line[1]}`;
      entries[dependencyString] = new Entry(dependencyString, "direct");
      return;
    }

    if (dependencyString in entries) {
      entry = entries[dependencyString];
    } else {
      entry = new Entry(dependencyString, "indirect");
      entries[dependencyString] = entry;
    }

    entry.addDependency(new Entry(`pkg:golang/${line[1]}`, "indirect"));
  });
  return entries;
};

run(parseDependents, undefined, "go mod graph");
