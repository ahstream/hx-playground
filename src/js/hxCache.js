import fs from 'fs';
import path from 'path';
import { sleep, ONE_DAY, ONE_MONTH } from 'hx-lib';

const DIR_NAME = 'hx-cache';
const DEFAULT_EXTENSION = 'json';
const DEFAULT_LIFETIME = 1 * ONE_MONTH;

function baseDir() {
  return path.join(process.cwd(), DIR_NAME);
}

export function read(name, lifetime = DEFAULT_LIFETIME, extension = DEFAULT_EXTENSION) {
  if (!name) {
    return null;
  }
  if (!lifetime) {
    return null;
  }
  const path = ensureFilepath(baseDir(), name, extension);
  if (!fs.existsSync(path)) {
    return null;
  }
  //console.log('path', path);
  // const data = JSON.parse(fs.readFileSync(new URL(path, import.meta.url)));
  const data = JSON.parse(fs.readFileSync(path));
  if (!data?.modified) {
    return null;
  }
  if (data.modified + lifetime < Date.now()) {
    console.log('cached item has expired');
    return null;
  }
  return data;
}

export function readRaw(name, extension = DEFAULT_EXTENSION) {
  if (!name) {
    return null;
  }
  const path = ensureFilepath(baseDir(), name, extension);
  if (!fs.existsSync(path)) {
    return null;
  }
  const data = JSON.parse(fs.readFileSync(path));
  return data;
}

export async function cacheOrCallback(name, callback, pauseAfter = 0, lifetime = DEFAULT_LIFETIME) {
  const fromCache = read(name, lifetime);
  if (fromCache?.value) {
    return fromCache.value;
  }
  const value = await callback();
  if (!value) {
    return null;
  }
  write(name, value);
  //console.log('sleep', pauseAfter);
  await sleep(pauseAfter);
  return value;
}

export function write(name, data, extension = DEFAULT_EXTENSION) {
  let str, obj;
  try {
    obj = {
      modified: Date.now(),
      value: data,
    };
    str = JSON.stringify(obj, null, 2);
  } catch (e) {
    str = JSON.stringify({ ...obj }, null, 2);
  }
  const path = ensureFilepath(baseDir(), name, extension);
  //console.log('path write', path);
  fs.writeFileSync(path, str);
}

export function writeRaw(name, data, extension = DEFAULT_EXTENSION) {
  let str, obj;
  try {
    (obj = data), (str = JSON.stringify(obj, null, 2));
  } catch (e) {
    str = JSON.stringify({ ...obj }, null, 2);
  }
  const path = ensureFilepath(baseDir(), name, extension);
  //console.log('path write', path);
  fs.writeFileSync(path, str);
}

export function ensureFilepath(dir, filename, extension) {
  //console.log('ensureFilepathFull', dir, filename, extension);

  const parts = filename.split('/');
  const filenamePart = parts.length < 2 ? filename : parts[parts.length - 1];
  const dirPart = parts.length < 2 ? [] : parts.slice(0, -1);
  //console.log('parts, filenamePart, dirPart', parts, filenamePart, dirPart);

  const fullDirPath = path.join(dir, ...dirPart);
  //console.log('fullDirPath', fullDirPath);

  if (!fs.existsSync(fullDirPath)) {
    fs.mkdirSync(fullDirPath, { recursive: true });
  }

  // const filenameWithExt = filenamePart.includes('.')
  // const fullFilePath = path.join(dir, ...dirPart, `${filenamePart}.${extension}`);
  const fullFilePath = path.join(dir, ...dirPart, filenamePart);
  //console.log('fullFilePath', fullFilePath);

  const finalPath = isDir(fullFilePath) ? fullFilePath + '.txt' : fullFilePath;
  //console.log('finalPath', finalPath);

  return finalPath;
}

function isDir(path) {
  try {
    var stat = fs.lstatSync(path);
    return stat.isDirectory();
  } catch (e) {
    // lstatSync throws an error if path doesn't exist
    return false;
  }
}

function ensureFilepath2(dir, filename, extension) {
  ensureDir(dir);
  return ensureFilepath(dir, `${filename}.${extension}`);
  // return path.join(dir, `${filename}.${extension}`);
}

function ensureDir(name) {
  if (!fs.existsSync(name)) {
    fs.mkdirSync(name);
  }
}
