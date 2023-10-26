import { read, readRaw, write, writeRaw } from './hxCache.js';
import { round, ensureProperty, sleep, ONE_DAY, ONE_WEEK, ONE_MONTH, ONE_YEAR } from 'hx-lib';
import { getDecaUserCache, getOwnersForCollectionCache, getContractMetadataCache } from './cacheHelpers.js';

export async function getDecaHoldersOfContracts(tag, contracts, subscribers, alchemyKey, ethplorerKey) {
  const context = {
    collections: {},
    holders: {},
    holdersTotal: {},
    holdersTotalSortedArr: [],
    holdersTotalSortedTextArr: {},
    decaUsers: {},
    decaUsersSorted: {},
    decaUsersSortedArr: [],
    decaUsersSortedTextArr: {},
    log: true,
  };

  await getHoldersOfContracts(contracts, context, alchemyKey, ethplorerKey);

  writeRaw(tag + '/holders.json', { holders: context.holders });
  writeRaw(tag + '/holdersTotal.json', { holdersTotal: context.holdersTotal });
  writeRaw(tag + '/collections.json', { collections: context.collections });
  writeRaw(tag + '/holdersTotalSortedArr.json', { holdersTotalSortedArr: context.holdersTotalSortedArr });
  writeRaw(tag + '/holdersTotalSortedTextArr.json', { holdersTotalSortedTextArr: context.holdersTotalSortedTextArr });

  if (subscribers?.length) {
    await getDecaHoldersOfContextBySubscribers(context, subscribers);
  } else {
    await getDecaHoldersOfContext(context);
  }

  writeRaw(tag + '/decaUsers.json', { decaUsers: context.decaUsers });
  writeRaw(tag + '/decaUsersSorted.json', { decaUsersSorted: context.decaUsersSorted });
  writeRaw(tag + '/decaUsersSortedArr.json', { decaUsersSortedArr: context.decaUsersSortedArr });
  writeRaw(tag + '/decaUsersSortedTextArr.json', { decaUsersSortedTextArr: context.decaUsersSortedTextArr });

  return context;
}

export async function getHoldersOfContracts(contractAddrs, context, alchemyKey, ethplorerKey) {
  for (const contractAddr of contractAddrs) {
    let sumHeld = 0;
    // const tokenInfo = await getTokenInfoCache(contractAddr, ethplorerKey, ONE_MONTH);
    const metadata = (await getContractMetadataCache(contractAddr, alchemyKey))?.contractMetadata;
    if (metadata?.tokenType) {
      context.collections[contractAddr] = metadata;
    }

    const owners = await getOwnersForCollectionCache(contractAddr, alchemyKey);
    for (const owner of owners?.ownerAddresses) {
      const sumHold = owner.tokenBalances.map((x) => x.balance).reduce((x, y) => x + y);

      ensureProperty(context.holders, owner.ownerAddress);
      ensureProperty(context.holders[owner.ownerAddress], contractAddr, 0);
      context.holders[owner.ownerAddress][contractAddr] += sumHold;

      ensureProperty(context.holdersTotal, owner.ownerAddress, 0);
      context.holdersTotal[owner.ownerAddress] += sumHold;

      sumHeld += sumHold;
    }

    // console.log('metadata', metadata);
    /*
    console.log('metadata.totalSupply', metadata.totalSupply);
    const totalSupply = Number(metadata.totalSupply);
    console.log(totalSupply, sumHeld, metadata?.name, metadata?.openSea?.floorPrice);
    if (totalSupply != sumHeld) {
      console.error('Supply <> held:', totalSupply, sumHeld);
    }
    */
  }

  context.holdersTotalSortedArr = Object.entries(context.holdersTotal).sort((a, b) => b[1] - a[1]);
  context.holdersTotalSorted = {};
  let numTotalTokens = 0;
  for (const arr of context.holdersTotalSortedArr) {
    context.holdersTotalSorted[arr[0]] = arr[1];
    numTotalTokens = numTotalTokens + arr[1];
  }
  context.holdersTotalSortedTextArr = context.holdersTotalSortedArr.map((x) => `${x[1]}: ${x[0]}`);
  console.log('Num total tokens:', numTotalTokens);
}

async function getDecaHoldersOfContext(context) {
  let ct = 0;
  const numHolders = Object.keys(context.holdersTotal).length;
  for (const holderAddr in context.holdersTotal) {
    ct++;
    if (context.log) {
      console.log(`Get Deca holder ${ct}/${numHolders}: ${holderAddr}`);
    }
    const numHold = context.holdersTotal[holderAddr];
    const user = await getDecaUserCache(holderAddr);
    // console.log('user', user);
    if (!user) {
      console.error('Invalid user', user);
      continue;
    }
    ensureProperty(context.decaUsers, user.username, user);
    ensureProperty(context.decaUsers[user.username], 'tokensHold', 0);
    context.decaUsers[user.username].tokensHold += numHold;
  }

  const decaUsersSortedArr = Object.values(Object.values(context.decaUsers))
    .map((x) => [x.username, x.tokensHold])
    .sort((a, b) => b[1] - a[1]);
  const decaUsersSorted = {};
  let sumHeldByAll = 0;
  for (const arr of decaUsersSortedArr) {
    decaUsersSorted[arr[0]] = arr[1];
    sumHeldByAll = sumHeldByAll + arr[1];
  }
  console.log('Total num tokens held by all:', sumHeldByAll);

  context.decaUsersSorted = decaUsersSorted;
  context.decaUsersSortedArr = decaUsersSortedArr;
  context.decaUsersSortedTextArr = decaUsersSortedArr.map((x) => `${x[1]}: ${x[0]}`);
}

async function getDecaHoldersOfContextBySubscribers(context, subscribers) {
  let ct = 0;
  for (const sub of subscribers) {
    ct++;
    const user = await getDecaUserCache(sub);
    if (!user) {
      console.error('Invalid user', user);
      continue;
    }
    let numHold = 0;
    for (const addr of user.walletsEth) {
      numHold = numHold + (context.holdersTotal[addr] || 0);
    }
    if (context.log) {
      console.log('sub, numHold:', ct, '/', subscribers.length, sub, numHold);
    }

    ensureProperty(context.decaUsers, user.username, user);
    ensureProperty(context.decaUsers[user.username], 'tokensHold', 0);
    context.decaUsers[user.username].tokensHold += numHold;
  }

  const decaUsersSortedArr = Object.values(Object.values(context.decaUsers))
    .map((x) => [x.username, x.tokensHold])
    .sort((a, b) => b[1] - a[1]);
  const decaUsersSorted = {};
  let sumHeldByAll = 0;
  for (const arr of decaUsersSortedArr) {
    decaUsersSorted[arr[0]] = arr[1];
    sumHeldByAll = sumHeldByAll + arr[1];
  }
  console.log('Total num tokens held by all:', sumHeldByAll);

  context.decaUsersSorted = decaUsersSorted;
  context.decaUsersSortedArr = decaUsersSortedArr;
  context.decaUsersSortedTextArr = decaUsersSortedArr.map((x) => `${x[1]}: ${x[0]}`);
}
