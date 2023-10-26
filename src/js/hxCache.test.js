import { read, readRaw, write, writeRaw } from './hxCache.js';

write('foo/bar/test.json', { foo: 123 });
write('foo.txt', { foo: 123 });
writeRaw('foo/gh/x.txt', { foo: 123 });
write('foo/bar', { foo: 123 });
