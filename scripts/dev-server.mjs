import { spawn } from 'node:child_process';
import { open, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const lockPath = resolve('.next-dev-server.lock');

async function acquireLock() {
  while (true) {
    try {
      const lock = await open(lockPath, 'wx');
      await lock.writeFile(String(process.pid));
      await lock.close();
      return true;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;

      let ownerPid;
      try {
        ownerPid = Number((await readFile(lockPath, 'utf8')).trim());
      } catch (readError) {
        if (readError.code === 'ENOENT') continue;
        throw readError;
      }

      if (!Number.isSafeInteger(ownerPid) || ownerPid <= 0) {
        await rm(lockPath, { force: true });
        continue;
      }

      try {
        process.kill(ownerPid, 0);
      } catch (processError) {
        if (processError.code === 'ESRCH') {
          await rm(lockPath, { force: true });
          continue;
        }
        throw processError;
      }

      console.error(`A development server is already running (PID ${ownerPid}). Stop it with Ctrl+C before starting another.`);
      return false;
    }
  }
}

if (!(await acquireLock())) {
  process.exitCode = 1;
} else {
  const nextCli = resolve('node_modules/next/dist/bin/next');
  const child = spawn(process.execPath, [nextCli, 'dev', ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: process.env,
  });
  let cleanupPromise;
  const cleanup = () => {
    cleanupPromise ??= rm(lockPath, { force: true });
    return cleanupPromise;
  };

  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
  child.on('error', async (error) => {
    console.error('Unable to start the Next.js development server:', error.message);
    await cleanup();
    process.exitCode = 1;
  });
  child.on('exit', async (code, signal) => {
    await cleanup();
    process.exitCode = signal ? 1 : code ?? 0;
  });
}
