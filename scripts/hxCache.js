import fs from 'fs';
import path from 'path';

const DIR_NAME = 'hx-cache';
const DEFAULT_EXTENSION = 'json';

function baseDir() {
  return path.join(process.cwd(), DIR_NAME);
}

export function read(name, extension = DEFAULT_EXTENSION) {
  const path = ensureFilepath(baseDir(), name, extension);
  if (!fs.existsSync(path)) {
    return null;
  }
  //console.log('path', path);
  // const data = JSON.parse(fs.readFileSync(new URL(path, import.meta.url)));
  const data = JSON.parse(fs.readFileSync(path));
  return data;
}

export function writeIfNew(name, data, extension = DEFAULT_EXTENSION) {
  if (read(name, extension)) {
    return false;
  }
  write(name, data, extension);
  return true;
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

function ensureFilepath(dir, filename, extension) {
  ensureDir(dir);
  return path.join(dir, `${filename}.${extension}`);
}

function ensureDir(name) {
  if (!fs.existsSync(name)) {
    fs.mkdirSync(name);
  }
}
