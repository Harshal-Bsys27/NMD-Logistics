import { execFileSync } from 'node:child_process';

export function getProcessState(pid, killProcess = process.kill) {
  try {
    killProcess(pid, 0);
    return 'running';
  } catch (error) {
    if (error.code === 'ESRCH') return 'stopped';
    if (error.code === 'EPERM') {
      if (process.platform !== 'win32') return 'inaccessible';
      try {
        const processes = execFileSync('tasklist.exe', [
          '/FI',
          `PID eq ${pid}`,
          '/FO',
          'CSV',
          '/NH',
        ], { encoding: 'utf8' });
        const matchingProcess = processes.split(/\r?\n/).some((line) => (
          line.split(',')[1]?.replaceAll('"', '').trim() === String(pid)
        ));
        return matchingProcess ? 'running' : 'stopped';
      } catch (verificationError) {
        if (verificationError.code === 'ENOENT') {
          throw new Error(`Cannot verify whether PID ${pid} is running because tasklist.exe is unavailable.`);
        }
        throw verificationError;
      }
    }
    throw error;
  }
}
