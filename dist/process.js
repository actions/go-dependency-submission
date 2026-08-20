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
Object.defineProperty(exports, "__esModule", { value: true });
exports.processGoIndirectDependencies = exports.processGoDirectDependencies = exports.processGoGraph = void 0;
const exec = __importStar(require("@actions/exec"));
const core = __importStar(require("@actions/core"));
const dependency_submission_toolkit_1 = require("@github/dependency-submission-toolkit");
const parse_1 = require("./parse");
const match_1 = require("./match");
function processGoGraph(goModDir, directDependencies, indirectDependencies) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Running 'go mod graph' in ${goModDir}`);
        const goModGraph = yield exec.getExecOutput('go', ['mod', 'graph'], {
            cwd: goModDir
        });
        if (goModGraph.exitCode !== 0) {
            core.error(goModGraph.stderr);
            core.setFailed("'go mod graph' failed!");
            throw new Error("Failed to execute 'go mod graph'");
        }
        /* add all direct and indirect packages to a new PackageCache */
        const cache = new dependency_submission_toolkit_1.PackageCache();
        directDependencies.forEach((pkg) => {
            cache.package(pkg);
        });
        indirectDependencies.forEach((pkg) => {
            cache.package(pkg);
        });
        const packageAssocList = (0, parse_1.parseGoModGraph)(goModGraph.stdout);
        packageAssocList.forEach(([parentPkg, childPkg]) => {
            /* Look up the parent package in the cache. go mod graph will return
             * multiple versions of packages with the same namespace and name. We
             * select only package versions used in the Go build target. */
            const targetPackage = cache.lookupPackage(parentPkg);
            if (!targetPackage)
                return;
            /* Look up the child package in the cache by namespace+name. The child
             * version specified by go mod graph is not guaranteed to be the one
             * selected when building Go build targets, so we match on
             * namespace+name (which uniquely identifies a Go module). */
            const match = (0, match_1.findMatchingPackage)(cache, childPkg);
            if (!match)
                return;
            // create the dependency relationship
            targetPackage.dependsOn(match);
        });
        return cache;
    });
}
exports.processGoGraph = processGoGraph;
// For a specific Go _build target_, these templates list dependencies used to
// in the build target. It does not provide association between the
// dependencies (i.e. which dependencies depend on which)
// eslint-disable-next-line quotes
// eslint-disable-next-line no-useless-escape
const GO_DIRECT_DEPS_TEMPLATE = '{{define "M"}}{{if not .Indirect}}{{.Path}}@{{.Version}}{{end}}{{end}}{{with .Module}}{{if not .Main}}{{if .Replace}}{{template "M" .Replace}}{{else}}{{template "M" .}}{{end}}{{end}}{{end}}';
// eslint-disable-next-line quotes
// eslint-disable-next-line no-useless-escape
const GO_INDIRECT_DEPS_TEMPLATE = '{{define "M"}}{{if .Indirect}}{{.Path}}@{{.Version}}{{end}}{{end}}{{with .Module}}{{if not .Main}}{{if .Replace}}{{template "M" .Replace}}{{else}}{{template "M" .}}{{end}}{{end}}{{end}}';
function processGoDirectDependencies(goModDir, goBuildTarget) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`go direct package detection in ${goModDir} on build target ${goBuildTarget}`);
        return processGoList(goModDir, goBuildTarget, GO_DIRECT_DEPS_TEMPLATE);
    });
}
exports.processGoDirectDependencies = processGoDirectDependencies;
function processGoIndirectDependencies(goModDir, goBuildTarget) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`go indirect package detection in ${goModDir} on build target ${goBuildTarget}`);
        return processGoList(goModDir, goBuildTarget, GO_INDIRECT_DEPS_TEMPLATE);
    });
}
exports.processGoIndirectDependencies = processGoIndirectDependencies;
function processGoList(goModDir, goBuildTarget, goListTemplate) {
    return __awaiter(this, void 0, void 0, function* () {
        const goList = yield exec.getExecOutput('go', ['list', '-deps', '-f', goListTemplate, goBuildTarget], { cwd: goModDir });
        if (goList.exitCode !== 0) {
            core.error(goList.stderr);
            core.setFailed("'go list' failed!");
            throw new Error("Failed to execute 'go list'");
        }
        return (0, parse_1.parseGoList)(goList.stdout);
    });
}
