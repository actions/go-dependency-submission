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
const core = __importStar(require("@actions/core"));
const dependency_submission_toolkit_1 = require("@github/dependency-submission-toolkit");
const go_mod_parser_1 = require("./go_mod_parser");
const path = __importStar(require("path"));
const process = __importStar(require("process"));
const execa_1 = __importDefault(require("execa"));
const parseDependentsFunc = go_mod_parser_1.parseDependents;
// Set the detector information provided from the action workflow input
const detector = {
    name: core.getInput("detector-name"),
    url: core.getInput("detector-url"),
    version: core.getInput("detector-version"),
};
function searchForFile(filename) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`searching for ${filename} in ${process.cwd()}`);
        const { stdout } = yield (0, execa_1.default)("find", [process.cwd(), "-name", filename]);
        const dirs = stdout
            .split("\n")
            .filter((s) => s.length > 0)
            // remove the file name
            .map((filename) => path.dirname(filename))
            // map to absolute path
            .map((pathname) => path.resolve(process.cwd(), pathname));
        return dirs;
    });
}
// Enumerate directories
function detect() {
    return __awaiter(this, void 0, void 0, function* () {
        const goModPaths = yield searchForFile("go.mod");
        // If provided, set the metadata provided from the action workflow input
        const metadataInput = core.getInput("metadata");
        goModPaths.forEach((path) => {
            process.chdir(path);
            console.log(`Running go mod graph in ${path}`);
            if (metadataInput.length < 1) {
                (0, dependency_submission_toolkit_1.run)(parseDependentsFunc, { command: "go mod graph" }, { detector });
            }
            else {
                const metadata = JSON.parse(metadataInput);
                (0, dependency_submission_toolkit_1.run)(parseDependentsFunc, { command: "go mod graph" }, { metadata, detector });
            }
        });
    });
}
detect();
