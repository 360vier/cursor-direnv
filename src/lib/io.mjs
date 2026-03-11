import { copyFile, mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export const ensureDir = async (path) => {
  await mkdir(path, { recursive: true });
};

export const fileExists = async (path) => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};

export const readJsonIfExists = async (path) => {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in "${path}".`);
    }
    throw error;
  }
};

export const writeJsonAtomic = async (path, value) => {
  await ensureDir(dirname(path));
  const tempPath = `${path}.${process.pid}.tmp`;
  const content = `${JSON.stringify(value, null, 2)}\n`;
  await writeFile(tempPath, content, "utf8");
  await rename(tempPath, path);
};

export const copyFileAtomic = async (sourcePath, destinationPath) => {
  await ensureDir(dirname(destinationPath));
  const tempPath = `${destinationPath}.${process.pid}.tmp`;
  await copyFile(sourcePath, tempPath);
  await rename(tempPath, destinationPath);
};

export const safeRemove = async (path) => {
  await rm(path, { force: true });
};
