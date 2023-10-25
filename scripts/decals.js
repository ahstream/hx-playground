import dotenv from 'dotenv';
dotenv.config();

import { round, fetchHelper, sleep, ONE_DAY, ONE_WEEK, ONE_MONTH, ONE_YEAR } from 'hx-lib';
import { getUser } from 'hx-deca-lib';
import { getTokenInfo, getTopTokenHolders } from 'hx-ethplorer-lib';
import { getOwnersForCollection } from 'hx-alchemy-lib';
import { read, readRaw, write, writeRaw } from './hxCache.js';
// import { randomBytes, createWallet } from 'hx-web3-lib';

const ETHPLORER_RATE_LIMIT_PAUSE = 200;
const ALCHEMY_RATE_LIMIT_PAUSE = 200;

async function main(alchemyKey, ethplorerKey, limit = 1000) {
  const collections = {};
  const holders = {};
  const holdersTotal = {};
  const decaUsers = {};

  for (const c of readRaw('contracts')) {
    let nSupply = 0;
    let nHold = 0;
    const ti = await getTokenInfoCache(c, ethplorerKey, ONE_MONTH);
    console.log(`getTokenInfo = `, ti?.name);
    //console.log(`getTokenInfo = `, ti);
    if (ti?.name) {
      collections[c] = ti;
    }
    nSupply = ti.totalSupply;

    const th = await getOwnersForCollection(c, true, alchemyKey);
    // console.log(`getOwnersForCollection = `, th);

    for (const h of th?.ownerAddresses) {
      const sumHold = h.tokenBalances.map((x) => x.balance).reduce((x, y) => x + y);
      // console.log('sumHold', sumHold);
      ensureProperty(holders, h.ownerAddress);
      ensureProperty(holders[h.ownerAddress], c, 0);
      holders[h.ownerAddress][c] += sumHold;

      ensureProperty(holdersTotal, h.ownerAddress, 0);
      holdersTotal[h.ownerAddress] += sumHold;

      nHold += sumHold;
    }
    console.log(nSupply, nHold);
    //return;

    /*
    const th = await getTopTokenHoldersCache(c, limit, apiKeyEthplorer, ONE_WEEK);
    console.log(`getTopTokenHolders = `, th?.holders?.length);
    console.log(`getTopTokenHolders = `, th?.holders);
    for (const h of th?.holders) {
      ensureProperty(holders, h.address);
      ensureProperty(holders[h.address], c, 0);
      holders[h.address][c] += h.balance;
      ensureProperty(holdersTotal, h.address, 0);
      holdersTotal[h.address] += h.balance;
      nHold += h.balance;
      console.log(h.address, h.balance);
    }
    console.log(nSupply, nHold);
    return;
    */
  }

  write('holders', { holders });
  write('holdersTotal', { holdersTotal });
  writeRaw('collections', { collections });

  const holdersTotalSortedArr = Object.entries(holdersTotal).sort((a, b) => b[1] - a[1]);
  const holdersTotalSorted = {};
  let n = 0;
  for (const arr of holdersTotalSortedArr) {
    holdersTotalSorted[arr[0]] = arr[1];
    n = n + arr[1];
  }
  console.log('n', n);
  write('holdersTotalSorted', { holdersTotalSorted });

  let ct = 0;
  for (const addr in holdersTotal) {
    ct++;
    if (ct > 10) {
      // break;
    }
    console.log('addr', addr);
    const numHold = holdersTotal[addr];
    const user = await getDecaUserCache(addr);
    // console.log('user', user);
    if (!user) {
      console.error('Invalid user', user);
      continue;
    }
    ensureProperty(decaUsers, user.username, user);
    ensureProperty(decaUsers[user.username], 'decalsHold', 0);
    decaUsers[user.username].decalsHold += numHold;
    write('decaUsersRunning', decaUsers);
  }

  write('decaUsers', decaUsers);

  const decaUsersSortedArr = Object.values(decaUsers)
    .map((x) => [x.username, x.decalsHold])
    .sort((a, b) => b[1] - a[1]);
  const decaUsersSorted = {};
  let n2 = 0;
  for (const arr of decaUsersSortedArr) {
    decaUsersSorted[arr[0]] = arr[1];
    n2 = n2 + arr[1];
  }
  console.log('n2', n2);
  const decaUsersSortedText = decaUsersSortedArr.map((x) => `${x[1]}: ${x[0]}`);
  write('decaUsersSortedArr', { decaUsersSortedArr });
  write('decaUsersSortedText', { decaUsersSortedText });
  write('decaUsersSorted', { decaUsersSorted });

  /*
  console.log('holdersTotalSorted', holdersTotalSorted);

  console.log(
    'holdersTotalSorted',
    holdersTotalSorted
      .map((x) => x[1])
      .reduce((accumulator, currentValue) => {
        return accumulator + currentValue;
      }, 0)
  );
  console.log(toObjArray(holders));
  console.log(toObjArray(holders).map((x) => toObjArray(x)));
  */
}

function toObjArray(obj) {
  const arr = [];
  for (const prop in obj) {
    arr.push(obj[prop]);
  }
  return arr;
}

function ensureProperty(parent, name, defaultVal = {}) {
  if (!parent[name]) {
    parent[name] = defaultVal;
  }
}

async function getDecaUserCache(usernameOrAddr, lifetime = ONE_YEAR, pause = 500) {
  const name = `getDecaUser-${usernameOrAddr}`;
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

async function getTokenInfoCache(addr, apiKey, lifetime = ONE_MONTH, pause = ETHPLORER_RATE_LIMIT_PAUSE) {
  const name = `getTokenInfo-${addr}`;
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

async function getTopTokenHoldersCache(addr, limit, apiKey, lifetime = ONE_WEEK, pause = ETHPLORER_RATE_LIMIT_PAUSE) {
  const name = `getTopTokenHolders-${addr}`;
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

main(process.env.ALCHEMY_API_KEY, process.env.ETHPLORER_API_KEY)
  .then(() => {})
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
