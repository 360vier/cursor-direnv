import { spawnSync } from "node:child_process";

export const isDirenvAvailable = () => {
  const result = spawnSync("direnv", ["version"], { stdio: "ignore" });
  if (result.error) {
    return false;
  }
  return result.status === 0;
};
