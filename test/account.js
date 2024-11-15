const test = require('tape').test ;
const config = require('config');
const dialect = process.env.JAMBONES_DB_DIALECT  || 'mysql';
const mysqlOpts = config.get(dialect);

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

test('account tests', async(t) => {
  const fn = require('..');
  const {lookupAccountBySid, lookupAccountBySipRealm, lookupAccountByPhoneNumber} = fn(mysqlOpts);
  try {
    let account = await lookupAccountBySid('422affb5-4d1e-45e8-b2a4-2623f08b95ef');
    t.ok(account !== null, 'retrieves account by sid');

    account = await lookupAccountBySipRealm('sip.drachtio.org');
    t.ok(account !== null, 'retrieves account by sip realm');

    account = await lookupAccountBySipRealm('mycompany.com');
    t.ok(account !== null, 'retrieves account by sip root realm');

    account = await lookupAccountBySipRealm('voxout.voxbone.com');
    t.ok(account === null, 'returns null for unknown sip realm');

    account = await lookupAccountByPhoneNumber('15083084809');
    t.ok(account.name === 'test', 'looks up account associated with phone number');

    t.end();
  }
  catch (err) {
    t.end(err);
  }
});

