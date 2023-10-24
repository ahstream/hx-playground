import { round, fetchHelper, sleep } from 'hx-lib';
import { getUser } from 'hx-deca-lib';
import { getTokenInfo, getTopTokenHolders } from 'hx-ethplorer-lib';
import { read, write, writeIfNew } from './hxCache.js';
// import { randomBytes, createWallet } from 'hx-web3-lib';

async function main() {
  /*
  const resp = await fetchHelper('https://www.google.com/');
  console.log('www.google.com:', resp.data.substr(0, 100));
  console.log(`round(10.1234, 2) = ${round(10.1234, 2)}`);
  const user1 = await getUser('hstream');
  console.log(`user1 = `, user1);
  const user2 = await getUser('0xc4e7b579d1be3c9e3a2151e54dc4b7124f148fd8');
  console.log(`user2 = `, user2);
  console.log(`getTopTokenHolders = `, await getTopTokenHolders('0x2f5956fC0F2d266027551636Ca1f9493251201b1'));
  //console.log(`createWallet() =`, createWallet());
  write('foo', { bar: 123 });
  console.log('foo1', read('foo1'));
  console.log('foo', read('foo'));
  */

  const contracts = read('contracts');
  // console.log('contracts', contracts);
  for (const c of contracts) {
    console.log(c);
    const name = `getTopTokenHolders-${c}`;
    //const ch = read(name)?.value;
    //const fh = await getTopTokenHolders(c);
    const ti = await getTokenInfo(c);
    await sleep(1000);
    console.log(`getTokenInfo = `, ti);
    const h = read(name)?.value || (await getTopTokenHolders(c));
    // console.log(`getTopTokenHolders = `, h);
    if (writeIfNew(name, h)) {
      await sleep(5000);
    }
  }
}

main()
  .then(() => {})
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
