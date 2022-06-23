"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseGoModGraph = exports.parseGoList = exports.parseGoPackage = void 0;
const path_1 = __importDefault(require("path"));
const packageurl_js_1 = require("packageurl-js");
function parseGoPackage(pkg) {
    const [qualifiedPackage, version] = pkg.split('@');
    let namespace = null;
    let name;
    if (qualifiedPackage.indexOf('/') !== -1) {
        namespace = path_1.default.dirname(qualifiedPackage);
        name = path_1.default.basename(qualifiedPackage);
    }
    else {
        name = qualifiedPackage;
    }
    return new packageurl_js_1.PackageURL('golang', namespace, name, version !== null && version !== void 0 ? version : null, null, null);
}
exports.parseGoPackage = parseGoPackage;
/**
 * parseGoList parses a list of Go packages (one per line) matching the format
 * "${GO_PACKAGE}@v{VERSION}" into Package URLs. This expects the output of 'go
 * list -deps' as input.
 *
 * @param {string} contents
 * @returns {Array<PackageURL>}
 */
function parseGoList(contents) {
    // split the input by newlines, sort, and dedup
    const packages = Array.from(new Set(contents.split('\n').map((p) => p.trim())));
    const purls = [];
    packages.forEach((pkg) => {
        if (!pkg.trim())
            return;
        purls.push(parseGoPackage(pkg));
    });
    return purls;
}
exports.parseGoList = parseGoList;
/**
 * parseGoModGraph parses an *associative list* of Go packages into tuples into
 * an associative list of PackageURLs. This expects the output of 'go mod
 * graph' as input
 */
function parseGoModGraph(contents) {
    const pkgAssocList = [];
    contents.split('\n').forEach((line) => {
        if (!line.trim())
            return;
        const [parentPkg, childPkg] = line.split(' ');
        pkgAssocList.push([parseGoPackage(parentPkg), parseGoPackage(childPkg)]);
    });
    return pkgAssocList;
}
exports.parseGoModGraph = parseGoModGraph;
