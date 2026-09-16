#!/usr/bin/env node
/**
 * Push slice models and custom types to the Prismic Custom Types API.
 *
 *   node scripts/prismic-push-models.mjs
 *
 * Reads every src/slices/<Name>/model.json and customtypes/<id>/index.json, inserts each one
 * (falling back to update on 409), verifies the result with GET /slices and GET /customtypes,
 * and records the ids in docs/project-config.json (prismic.slices, prismic.customTypes).
 *
 * Credentials come from docs/project-config.json (prismic.repositoryName, prismic.writeToken).
 * The token is never printed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(root, 'docs/project-config.json');
const readJSON = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

const config = readJSON(configPath);
const repositoryName = config.prismic?.repositoryName;
const writeToken = config.prismic?.writeToken;
if (!repositoryName || !writeToken) {
  console.error(
    'docs/project-config.json must contain prismic.repositoryName and prismic.writeToken'
  );
  process.exit(1);
}

const API = 'https://customtypes.prismic.io';
const headers = {
  repository: repositoryName,
  Authorization: `Bearer ${writeToken}`,
  'Content-Type': 'application/json',
};

async function call(method, route, body) {
  const res = await fetch(`${API}${route}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, text: await res.text() };
}

/** Insert a model, or update it when it already exists (409). Throws with the API's response body on failure. */
async function upsert(kind, model) {
  let res = await call('POST', `/${kind}/insert`, model);
  let action = 'created';
  if (res.status === 409) {
    res = await call('POST', `/${kind}/update`, model);
    action = 'updated';
  }
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`${kind}/${model.id}: HTTP ${res.status} ${res.text || '(empty body)'}`);
  }
  return action;
}

function loadModels() {
  const slicesDir = path.join(root, 'src/slices');
  const slices = fs
    .readdirSync(slicesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(slicesDir, d.name, 'model.json')))
    .map((d) => readJSON(path.join(slicesDir, d.name, 'model.json')));
  const typesDir = path.join(root, 'customtypes');
  const customTypes = fs
    .readdirSync(typesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(typesDir, d.name, 'index.json')))
    .map((d) => readJSON(path.join(typesDir, d.name, 'index.json')));
  return { slices, customTypes };
}

async function main() {
  const { slices, customTypes } = loadModels();
  console.log(`Repository: ${repositoryName}`);
  console.log(`Pushing ${slices.length} slice models and ${customTypes.length} custom types`);

  const failures = [];
  // Slices first: the custom types' slice zones reference them.
  for (const [kind, models] of [
    ['slices', slices],
    ['customtypes', customTypes],
  ]) {
    for (const model of models) {
      try {
        const action = await upsert(kind, model);
        console.log(`  ${kind}/${model.id}: ${action}`);
      } catch (err) {
        failures.push(err.message);
        console.error(`  ${err.message}`);
      }
    }
  }

  // Verify: insert returns an empty body, so read the lists back.
  const remoteSlices = JSON.parse((await call('GET', '/slices')).text).map((s) => s.id);
  const remoteTypes = JSON.parse((await call('GET', '/customtypes')).text).map((t) => t.id);
  console.log(`\nSlices in repository (${remoteSlices.length}): ${remoteSlices.join(', ')}`);
  console.log(`Custom types in repository (${remoteTypes.length}): ${remoteTypes.join(', ')}`);

  const missingSlices = slices.map((s) => s.id).filter((id) => !remoteSlices.includes(id));
  const missingTypes = customTypes.map((t) => t.id).filter((id) => !remoteTypes.includes(id));
  if (missingSlices.length) console.error(`Missing slices: ${missingSlices.join(', ')}`);
  if (missingTypes.length) console.error(`Missing custom types: ${missingTypes.join(', ')}`);

  // Record what is in the repository (read-modify-write, keeps every other key).
  const current = readJSON(configPath);
  current.prismic.slices = slices.map((s) => s.id).filter((id) => remoteSlices.includes(id));
  current.prismic.customTypes = customTypes
    .map((t) => t.id)
    .filter((id) => remoteTypes.includes(id));
  fs.writeFileSync(configPath, JSON.stringify(current, null, 2) + '\n');

  if (failures.length || missingSlices.length || missingTypes.length) {
    console.error(`\n${failures.length} request(s) failed.`);
    process.exit(1);
  }
  console.log('\nAll models pushed and verified.');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
