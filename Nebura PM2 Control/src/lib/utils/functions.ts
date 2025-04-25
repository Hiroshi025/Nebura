import fs from "fs";
import path from "path";

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
export const getFiles = (
  requestedPath: string,
  allowedExtensions: string[] = [".js", ".mjs", ".cjs", ".ts"],
): string[] => {
  // If allowedExtensions is a string, convert it to an array
  if (typeof allowedExtensions === "string") {
    allowedExtensions = [allowedExtensions];
  }

  // Resolve the requested path to an absolute path
  requestedPath ??= path.resolve(requestedPath);
  let res: string[] = [];

  // Iterate through the directory contents
  for (let itemInDir of fs.readdirSync(requestedPath)) {
    itemInDir = path.resolve(requestedPath, itemInDir);
    const stat = fs.statSync(itemInDir);

    // If the item is a directory, recursively retrieve files
    if (stat.isDirectory()) {
      res = res.concat(getFiles(itemInDir, allowedExtensions));
    }

    // If the item is a file and matches the allowed extensions, add it to the result
    if (
      stat.isFile() &&
      allowedExtensions.find((ext) => itemInDir.endsWith(ext)) &&
      !itemInDir.slice(itemInDir.lastIndexOf(path.sep) + 1, itemInDir.length).startsWith(".")
    ) {
      res.push(itemInDir);
    }
  }

  return res;
};
