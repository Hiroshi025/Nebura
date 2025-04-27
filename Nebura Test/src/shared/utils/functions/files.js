"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFiles = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Recursively retrieves all files from a given directory that match the specified extensions.
 *
 * @param requestedPath - The path to the directory where files should be searched.
 * @param allowedExtensions - An array of file extensions to filter the files. Defaults to [".js", ".mjs", ".cjs", ".ts"].
 *                             If a single string is provided, it will be converted into an array.
 * @returns An array of file paths that match the allowed extensions.
 *
 * @example
 * ```typescript
 * const files = getFiles("./src", [".ts", ".js"]);
 * console.log(files); // Outputs an array of file paths with .ts or .js extensions
 * ```
 */
const getFiles = (requestedPath, allowedExtensions = [".js", ".mjs", ".cjs", ".ts"]) => {
    // If allowedExtensions is a string, convert it to an array
    if (typeof allowedExtensions === "string") {
        allowedExtensions = [allowedExtensions];
    }
    // Resolve the requested path to an absolute path
    requestedPath ??= path_1.default.resolve(requestedPath);
    let res = [];
    // Iterate through the directory contents
    for (let itemInDir of fs_1.default.readdirSync(requestedPath)) {
        itemInDir = path_1.default.resolve(requestedPath, itemInDir);
        const stat = fs_1.default.statSync(itemInDir);
        // If the item is a directory, recursively retrieve files
        if (stat.isDirectory()) {
            res = res.concat((0, exports.getFiles)(itemInDir, allowedExtensions));
        }
        // If the item is a file and matches the allowed extensions, add it to the result
        if (stat.isFile() &&
            allowedExtensions.find((ext) => itemInDir.endsWith(ext)) &&
            !itemInDir.slice(itemInDir.lastIndexOf(path_1.default.sep) + 1, itemInDir.length).startsWith(".")) {
            res.push(itemInDir);
        }
    }
    return res;
};
exports.getFiles = getFiles;
