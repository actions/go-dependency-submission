"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const dependency_submission_toolkit_1 = require("@github/dependency-submission-toolkit");
const process_1 = require("./process");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const goModPath = path_1.default.normalize(core.getInput('go-mod-path', { required: true }));
        if (path_1.default.basename(goModPath) !== 'go.mod' || !fs_1.default.existsSync(goModPath)) {
            throw new Error(`${goModPath} is not a go.mod file or does not exist!`);
        }
        const goModDir = path_1.default.dirname(goModPath);
        let goBuildTarget = core.getInput('go-build-target');
        if (goBuildTarget !== 'all' && goBuildTarget !== './...') {
            if (!fs_1.default.existsSync(goBuildTarget)) {
                throw new Error(`The build target '${goBuildTarget}' does not exist`);
            }
            if (goModDir !== '.') {
                if (goBuildTarget.startsWith(goModDir)) {
                    goBuildTarget = goBuildTarget.replace(goModDir, '');
                    goBuildTarget = goBuildTarget.startsWith('/')
                        ? goBuildTarget.substring(1)
                        : goBuildTarget;
                }
                else {
                    throw new Error(`The build target ${goBuildTarget} is not a sub-directory of ${goModDir}`);
                }
            }
        }
        const directDeps = yield (0, process_1.processGoDirectDependencies)(goModDir, goBuildTarget);
        const indirectDeps = yield (0, process_1.processGoIndirectDependencies)(goModDir, goBuildTarget);
        const packageCache = yield (0, process_1.processGoGraph)(goModDir, directDeps, indirectDeps);
        // if using the pseudotargets "all" or "./...", use the path to go.mod as filepath
        const filepath = goBuildTarget === 'all' || goBuildTarget === './...'
            ? goModPath
            : path_1.default.join(goModDir, goBuildTarget);
        const manifest = new dependency_submission_toolkit_1.Manifest(goBuildTarget, filepath);
        directDeps.forEach((pkgUrl) => {
            const dep = packageCache.lookupPackage(pkgUrl);
            if (!dep) {
                throw new Error('assertion failed: expected all direct dependencies to have entries in PackageCache');
            }
            manifest.addDirectDependency(dep);
        });
        indirectDeps.forEach((pkgUrl) => {
            const dep = packageCache.lookupPackage(pkgUrl);
            if (!dep) {
                throw new Error('assertion failed: expected all indirect dependencies to have entries in PackageCache');
            }
            manifest.addIndirectDependency(dep);
        });
        const snapshot = new dependency_submission_toolkit_1.Snapshot({
            name: 'actions/go-dependency-submission',
            url: 'https://github.com/actions/go-dependency-submission',
            version: '0.0.1'
        }, github.context, {
            correlator: `${github.context.job}-${goBuildTarget}`,
            id: github.context.runId.toString()
        });
        snapshot.addManifest(manifest);
        (0, dependency_submission_toolkit_1.submitSnapshot)(snapshot);
    });
}
main();
