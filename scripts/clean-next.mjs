import { readFile, rm } from 'node:fs/promises';
import { getProcessState } from './process-state.mjs';

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
    const ownerState = getProcessState(ownerPid);
    if (ownerState !== 'stopped') {
      throw new Error(ownerState === 'inaccessible'
        ? `Cannot verify lock owner PID ${ownerPid} because Windows denied access. Check that process before cleaning build output.`
        : 'Stop the development server with Ctrl+C before cleaning its build output.');
    }
  }
  await rm(lockPath, { force: true });
}

await rm('.next-dev', { recursive: true, force: true });
