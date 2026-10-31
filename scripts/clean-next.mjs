import { readFile, rm } from 'node:fs/promises';

const lockPath = '.next-dev-server.lock';
let lockContents;
try {
  lockContents = await readFile(lockPath, 'utf8');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

if (lockContents) {
  const ownerPid = Number(lockContents.trim());
  if (Number.isSafeInteger(ownerPid) && ownerPid > 0) {
    try {
      process.kill(ownerPid, 0);
      throw new Error('Stop the development server with Ctrl+C before cleaning its build output.');
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }
  }
  await rm(lockPath, { force: true });
}

await rm('.next-dev', { recursive: true, force: true });
