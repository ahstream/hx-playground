import dotenv from 'dotenv';
dotenv.config();

import results from './shape.json';
console.log()
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

main('hafftka', 'hafftka-contracts.json', 'hafftka-subs.json')
  .then(() => {})
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
