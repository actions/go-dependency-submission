"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDependents = void 0;
const processor_1 = require("@github/dependency-snapshot-action/dist/processor");
function parseDependents(contents) {
    const stdoutArr = contents.split('\n');
    const splitStdoutArr = stdoutArr.map(function (line) {
        return line.split(' ');
    });
    const entries = {};
    const repoName = splitStdoutArr[0][0];
    splitStdoutArr.forEach((line) => {
        if (line === undefined || line.length < 2)
            return; // skip empty lines
        let targetEntry;
        const targetPkg = `pkg:golang/${line[0]}`;
        let dependencyEntry;
        const dependencyPkg = `pkg:golang/${line[1]}`;
        const matchFound = line[0].match(repoName);
        if (matchFound && matchFound.index != null) {
            entries[dependencyPkg] = new processor_1.Entry(dependencyPkg, 'direct');
            return;
        }
        if (targetPkg in entries) {
            targetEntry = entries[targetPkg];
        }
        else {
            targetEntry = new processor_1.Entry(targetPkg, 'indirect');
            entries[targetPkg] = targetEntry;
        }
        if (dependencyPkg in entries) {
            dependencyEntry = entries[dependencyPkg];
        }
        else {
            dependencyEntry = new processor_1.Entry(dependencyPkg, 'indirect');
            entries[dependencyPkg] = dependencyEntry;
        }
        targetEntry.addDependency(dependencyEntry);
    });
    return entries;
}
exports.parseDependents = parseDependents;
