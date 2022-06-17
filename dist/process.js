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
exports.processGoBuildTarget = exports.processGoGraph = void 0;
const path_1 = __importDefault(require("path"));
const exec = __importStar(require("@actions/exec"));
const core = __importStar(require("@actions/core"));
const dependency_submission_toolkit_1 = require("@github/dependency-submission-toolkit");
const parse_1 = require("./parse");
function processGoGraph(goModDir) {
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
        const cache = new dependency_submission_toolkit_1.PackageCache();
        const packageAssocList = (0, parse_1.parseGoModGraph)(goModGraph.stdout);
        packageAssocList.forEach(([parentPkg, childPkg]) => {
            cache.package(parentPkg).dependsOn(cache.package(childPkg));
        });
        return cache;
    });
}
exports.processGoGraph = processGoGraph;
// For a specific Go _build target_, this template lists all dependencies used
// to build the build target It does not provide association between the
// dependencies (i.e. which dependencies depend on which)
// eslint-disable-next-line quotes
// eslint-disable-next-line no-useless-escape
const GO_LIST_DEP_TEMPLATE = '{{define "M"}}{{.Path}}@{{.Version}}{{end}}{{with .Module}}{{if not .Main}}{{if .Replace}}{{template "M" .Replace}}{{else}}{{template "M" .}}{{end}}{{end}}{{end}}';
function processGoBuildTarget(goModDir, goBuildTarget, cache) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Running go package detection in ${goModDir} on build target ${goBuildTarget}`);
        const goList = yield exec.getExecOutput('go', ['list', '-deps', '-f', GO_LIST_DEP_TEMPLATE, goBuildTarget], { cwd: goModDir });
        if (goList.exitCode !== 0) {
            core.error(goList.stderr);
            core.setFailed("'go list' failed!");
            throw new Error("Failed to execute 'go list'");
        }
        const dependencies = (0, parse_1.parseGoList)(goList.stdout);
        const manifest = new dependency_submission_toolkit_1.BuildTarget(goBuildTarget, path_1.default.join(goModDir, goBuildTarget));
        dependencies.forEach((dep) => {
            manifest.addBuildDependency(cache.package(dep));
        });
        return manifest;
    });
}
exports.processGoBuildTarget = processGoBuildTarget;
