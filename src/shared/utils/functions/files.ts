import fs from "fs";
import path from "path";

export const getFiles = (
  requestedPath: string,
  allowedExtensions: string[] = [".js", ".mjs", ".cjs", ".ts"]
): string[] => {
  if (typeof allowedExtensions === "string") {
    allowedExtensions = [allowedExtensions];
  }

  requestedPath ??= path.resolve(requestedPath);
  let res: string[] = [];

  for (let itemInDir of fs.readdirSync(requestedPath)) {
    itemInDir = path.resolve(requestedPath, itemInDir);
    const stat = fs.statSync(itemInDir);

    if (stat.isDirectory()) {
      res = res.concat(getFiles(itemInDir, allowedExtensions));
    }

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