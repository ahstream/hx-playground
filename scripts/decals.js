import dotenv from 'dotenv';
dotenv.config();

import { readRaw, writeRaw } from '../src/js/hxCache.js';
import { getDecaHoldersOfContracts } from '../src/js/getHolders.js';

async function main(tag, contractsFilename, subscribersFilename = null) {
  const context = await getDecaHoldersOfContracts(
    tag,
    readRaw(contractsFilename),
    readRaw(subscribersFilename),
    process.env.ALCHEMY_API_KEY,
    process.env.ETHPLORER_API_KEY
  );
  writeRaw(tag + '/context.json', { context });
}

main('decals', 'decal-contracts.json', null)
  .then(() => {})
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
