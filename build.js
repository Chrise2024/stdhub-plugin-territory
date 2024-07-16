import { exec } from 'child_process';
import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import fsExtra from 'fs-extra';
import yaml from 'yaml';
import JSZip from 'jszip';

const config = yaml.parse(fs.readFileSync(path.resolve('plugin.yaml')).toString());
const pluginFileName = `${config.plugin.name}.stdplugin`;
let devEnv = false;

async function bundleJs() {
  console.log('Building...');
  await esbuild.build({
    entryPoints: [ path.resolve('scripts', 'main.ts') ],
    bundle: true,
    format: 'esm',
    outfile: path.resolve('lib', 'main.js'),
    external: [ '@minecraft/server', '@minecraft/server-net', '@minecraft/server-admin' ],
    minify: !devEnv,
    define: {
      'process.env.PLUGIN_NAME': `'${config.plugin.name}'`,
    }
  });
}

async function bundlePlugin() {
  console.log('Bundling...');
  let bundled = new JSZip();
  bundled.file('script.js', fs.readFileSync(path.resolve('lib', 'main.js')));
  bundled.file('plugin.json', JSON.stringify(config));
  fsExtra.ensureDirSync(path.resolve('dist'));
  await bundled.generateAsync({ type: 'nodebuffer' })
    .then(data => fs.writeFileSync(path.join('dist', pluginFileName), data));
}

async function copyPlugin() {
  fs.copyFileSync(
    path.join('dist', pluginFileName),
    path.join(process.env.debugCopyDest, pluginFileName)
  );
  console.log(`Copied to destination ${process.env.debugCopyDest}`);
}

export async function fetchVersions(packageName) {
  return new Promise((resolve, reject) => {
    exec(`npm view ${packageName} versions --json`, (err, stdout) => {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(stdout));
      }
    });
  });
}

const versionExp = /^(\d+\.\d+\.\d+-beta\.\d+\.\d+\.\d+)-stable$/;
const reducedVersionExp = /^\d+\.\d+\.\d+-beta\.(\d+\.\d+\.\d+)$/;

async function updateDependency() {
  console.log('Fetching @minecraft/server versions with npm...');
  const versionList = (await fetchVersions('@minecraft/server'))
    .filter(version => versionExp.test(version))
    .map(original => {
      const reducedVersion = original.match(versionExp)[1];
      const [ , releaseVersion ] = reducedVersion.match(reducedVersionExp);
      return { original, releaseVersion };
    });
  const foundOrNull = versionList.find(entry => entry.releaseVersion === config.targetMinecraftVersion);
  if (!foundOrNull) {
    console.log('The Minecraft version you\'ve specified in plugin.yaml cannot be found in @minecraft/server.');
    console.log('See https://www.npmjs.com/package/@minecraft/server?activeTab=versions for possible versions.');
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync('package.json').toString());
  packageJson.dependencies['@minecraft/server'] = foundOrNull.original;
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log('Successfully patched package.json:');
  console.log(`  "@minecraft/server": "${foundOrNull.original}"`);
  console.log('Please execute `npm install` (or other package managers) and FULLY CHECK YOUR CODE!');
}

const task = process.argv[2];
switch (task) {
  case 'build': {
    bundleJs().then(bundlePlugin);
    break;
  }
  case 'debug': {
    devEnv = true;
    bundleJs().then(bundlePlugin).then(copyPlugin);
    break;
  }
  case 'update-dependency': {
    updateDependency();
    break;
  }
  default: {
    console.log('Unknown task.');
    process.exit(1);
  }
}