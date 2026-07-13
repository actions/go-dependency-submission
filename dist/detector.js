"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultSnapshotDetector = void 0;
const packageJson = require('../package.json');
function getProjectVersion() {
    if (typeof packageJson.version !== 'string' || packageJson.version === '') {
        throw new Error('Invalid package version in package.json');
    }
    return packageJson.version;
}
function getDefaultSnapshotDetector() {
    return {
        name: 'actions/go-dependency-submission',
        url: 'https://github.com/actions/go-dependency-submission',
        version: getProjectVersion()
    };
}
exports.getDefaultSnapshotDetector = getDefaultSnapshotDetector;
