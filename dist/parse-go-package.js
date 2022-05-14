"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDependents = void 0;
const processor_1 = require("@github/dependency-submission-toolkit/dist/processor");
const path_1 = __importDefault(require("path"));
// processes a list of go dependencies, one dependency per line, matching the
// format "${GO_PACKAGE}@v{VERSION}"
function parseDependents(contents) {
    // split the input by newlines, sort, and dedup
    const packages = Array.from(new Set(contents
        .split('\n')
        .map((p) => p.trim())
        .sort()));
    const entries = {};
    packages.forEach((pkg) => {
        if (!pkg)
            return;
        const [qualifiedPackage, version] = pkg.split('@');
        // URI-encode slashes in the namespace
        const namespace = encodeURIComponent(path_1.default.dirname(qualifiedPackage));
        const name = path_1.default.basename(qualifiedPackage);
        const targetPkg = `pkg:golang/${namespace}/${name}@${version}`;
        entries[targetPkg] = new processor_1.Entry(targetPkg);
    });
    return entries;
}
exports.parseDependents = parseDependents;
