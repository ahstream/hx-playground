import { read, write } from './hxCache.js';
import { getUser } from 'hx-deca-lib';
import { getOwnersForCollection, getContractMetadata } from 'hx-alchemy-lib';
import { getTokenInfo, getTopTokenHolders } from 'hx-ethplorer-lib';
import { sleep, ONE_DAY, ONE_WEEK, ONE_MONTH, ONE_YEAR } from 'hx-lib';

const ETHPLORER_RATE_LIMIT_PAUSE = 200;
const ALCHEMY_RATE_LIMIT_PAUSE = 200;

export async function getDecaUserCache(usernameOrAddr, lifetime = ONE_YEAR, pause = 500) {
  const name = `getDecaUser/${usernameOrAddr}.json`;
  const cache = read(name, lifetime);
  if (cache?.value) {
    return cache.value;
  }
  const value = await getUser(usernameOrAddr);
  if (value?.username) {
    write(name, value);
  }
  await sleep(pause || 0);
  return value;
}

export async function getOwnersForCollectionCache(addr, apiKey, lifetime = ONE_DAY, pause = ALCHEMY_RATE_LIMIT_PAUSE) {
  const name = `getOwnersForCollection/${addr}.json`;
  const cache = read(name, lifetime);
  if (cache?.value) {
    return cache.value;
  }

  const value = await getOwnersForCollection(addr, true, apiKey);
  if (value?.ownerAddresses) {
    write(name, value);
  }
  await sleep(pause || 0);
  return value;
}

export async function getContractMetadataCache(addr, apiKey, lifetime = ONE_DAY, pause = ALCHEMY_RATE_LIMIT_PAUSE) {
  const name = `getContractMetadata/${addr}.json`;
  const cache = read(name, lifetime);
  if (cache?.value) {
    return cache.value;
  }

  const value = await getContractMetadata(addr, apiKey);
  //console.log('value', value);
  if (value?.contractMetadata) {
    write(name, value);
  }
  await sleep(pause || 0);
  return value;
}

export async function getTokenInfoCache(addr, apiKey, lifetime = ONE_MONTH, pause = ETHPLORER_RATE_LIMIT_PAUSE) {
  const name = `getTokenInfo/${addr}.json`;
  const cache = read(name, lifetime);
  if (cache?.value) {
    return cache.value;
  }
  const value = await getTokenInfo(addr, apiKey);
  if (value?.address) {
    write(name, value);
  }
  await sleep(pause || 0);
  return value;
}

export async function getTopTokenHoldersCache(addr, limit, apiKey, lifetime = ONE_WEEK, pause = ETHPLORER_RATE_LIMIT_PAUSE) {
  const name = `getTopTokenHolders/${addr}-${limit}.json`;
  const cache = read(name, lifetime);
  if (cache?.value) {
    return cache.value;
  }
  const value = await getTopTokenHolders(addr, limit, apiKey);
  if (value?.holders) {
    write(name, value);
  }
  await sleep(pause || 0);
  return value;
}
