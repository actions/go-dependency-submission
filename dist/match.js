"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findMatchingPackage = void 0;
/**
 * Finds the package in the cache that matches the given child PURL on both
 * name and namespace. Treats null and undefined namespaces as equivalent so
 * Go modules sharing a name (e.g. those ending in /go) are disambiguated.
 */
function findMatchingPackage(cache, childPkg) {
    const matches = cache
        .packagesMatching({ name: childPkg.name })
        .filter((p) => { var _a, _b; return ((_a = p.packageURL.namespace) !== null && _a !== void 0 ? _a : null) === ((_b = childPkg.namespace) !== null && _b !== void 0 ? _b : null); });
    if (matches.length === 0)
        return undefined;
    if (matches.length !== 1) {
        throw new Error('assertion failed: expected no more than one package in cache with namespace+name. ' +
            'Found: ' +
            JSON.stringify(matches) +
            ' for ' +
            JSON.stringify({
                name: childPkg.name,
                namespace: childPkg.namespace
            }));
    }
    return matches[0];
}
exports.findMatchingPackage = findMatchingPackage;
