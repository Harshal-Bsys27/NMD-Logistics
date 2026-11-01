import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const androidRoot = path.join(projectRoot, 'android');
const generatedRoot = path.join(androidRoot, 'app', 'build', 'generated');
const releaseBundle = path.join(generatedRoot, 'nmd-release-assets', 'index.android.bundle');
const releaseResources = path.join(generatedRoot, 'nmd-release-res');
const localProperties = path.join(androidRoot, 'local.properties');
const apkPath = path.join(androidRoot, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const isWindows = process.platform === 'win32';
const wrapper = path.join(androidRoot, isWindows ? 'gradlew.bat' : 'gradlew');

function runGradle(args, cwd, env, gradleWrapper = wrapper) {
  const result = isWindows
    ? spawnSync(
      process.env.ComSpec || 'cmd.exe',
      ['/d', '/c', `call ${gradleWrapper} ${args.join(' ')}`],
      { cwd, env, stdio: 'inherit' },
    )
    : spawnSync(gradleWrapper, args, { cwd, env, stdio: 'inherit' });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Gradle exited with status ${result.status ?? 'unknown'}.`);
  }
}

function mapShortDrive(target, excluded = []) {
  for (const letter of 'MNOPQRSTUVWXYZ') {
    if (excluded.includes(letter) || fs.existsSync(`${letter}:\\`)) continue;
    const result = spawnSync('subst.exe', [`${letter}:`, target], { stdio: 'ignore' });
    if (result.status === 0) return letter;
  }
  throw new Error('No unused drive letter is available for the short-path Android build.');
}

function removeMappedDrive(letter) {
  const result = spawnSync('subst.exe', ['/d', `${letter}:`], { stdio: 'ignore' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Could not remove temporary ${letter}: drive mapping.`);
}

function restoreLocalProperties(hadFile, originalContent) {
  if (hadFile) {
    fs.writeFileSync(localProperties, originalContent);
  } else if (fs.existsSync(localProperties)) {
    fs.unlinkSync(localProperties);
  }
}

function buildWindowsRelease() {
  const sdkRoot = process.env.ANDROID_HOME
    || process.env.ANDROID_SDK_ROOT
    || path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk');
  if (!fs.existsSync(sdkRoot)) {
    throw new Error(`Android SDK directory was not found: ${sdkRoot}`);
  }

  fs.mkdirSync(path.dirname(releaseBundle), { recursive: true });
  fs.mkdirSync(releaseResources, { recursive: true });
  const buildEnv = { ...process.env };
  delete buildEnv.NMD_USE_PREBUILT_RELEASE_BUNDLE;
  const metroCli = path.join(projectRoot, 'node_modules', 'react-native', 'cli.js');
  const bundleResult = spawnSync(
    process.execPath,
    [
      metroCli,
      'bundle',
      '--platform',
      'android',
      '--dev',
      'false',
      '--entry-file',
      'index.js',
      '--bundle-output',
      releaseBundle,
      '--assets-dest',
      releaseResources,
    ],
    { cwd: projectRoot, env: buildEnv, stdio: 'inherit' },
  );
  if (bundleResult.error) throw bundleResult.error;
  if (bundleResult.status !== 0) {
    throw new Error(`Metro exited with status ${bundleResult.status ?? 'unknown'}.`);
  }
  if (!fs.existsSync(releaseBundle)) {
    throw new Error(`Metro completed without producing the release bundle: ${releaseBundle}`);
  }

  const hadLocalProperties = fs.existsSync(localProperties);
  const originalLocalProperties = hadLocalProperties ? fs.readFileSync(localProperties) : null;
  let projectDrive;
  let sdkDrive;

  try {
    projectDrive = mapShortDrive(projectRoot);
    sdkDrive = mapShortDrive(sdkRoot, [projectDrive]);
    fs.writeFileSync(localProperties, `sdk.dir=${sdkDrive}:\\\\\n`, 'ascii');

    const mappedAndroidRoot = `${projectDrive}:\\android`;
    const mappedWrapper = path.join(mappedAndroidRoot, 'gradlew.bat');
    runGradle(
      ['--no-daemon', '--console', 'plain', ':app:assembleRelease', '-PreactNativeArchitectures=arm64-v8a'],
      mappedAndroidRoot,
      { ...process.env, NMD_USE_PREBUILT_RELEASE_BUNDLE: '1' },
      mappedWrapper,
    );
  } finally {
    try {
      restoreLocalProperties(hadLocalProperties, originalLocalProperties);
    } catch (error) {
      console.error('Could not restore android/local.properties.', error);
      process.exitCode = 1;
    }
    if (sdkDrive) {
      try {
        removeMappedDrive(sdkDrive);
      } catch (error) {
        console.error('Could not remove the temporary Android SDK drive.', error);
        process.exitCode = 1;
      }
    }
    if (projectDrive) {
      try {
        removeMappedDrive(projectDrive);
      } catch (error) {
        console.error('Could not remove the temporary project drive.', error);
        process.exitCode = 1;
      }
    }
  }
}

function buildRelease() {
  if (isWindows) {
    buildWindowsRelease();
  } else {
    runGradle(['--no-daemon', '--console', 'plain', 'assembleRelease'], androidRoot, process.env);
  }
  console.log(`Release APK created: ${apkPath}`);
}

try {
  buildRelease();
} catch (error) {
  console.error('Could not build the standalone Android release APK.', error);
  process.exitCode = 1;
}
