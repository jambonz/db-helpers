const test = require('tape').test ;
const config = require('config');
const mysqlOpts = config.get('mysql');
const {execSync} = require('child_process');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

test('lcr tests', async(t) => {
  const fn = require('..');
  const {
    lookupOutboundCarrierForAccount
  } = fn(mysqlOpts);
  try {
    let carrier_sid = await lookupOutboundCarrierForAccount('ee9d7d49-b3e4-4fdb-9d66-661149f717e8');
    t.ok(carrier_sid === '287c1452-620d-4195-9f19-c9814ef90d78', 'finds random outbound carrier at account level');
  
    // clear data and insert data with multiple carriers in same priority
    execSync(`mysql -h 127.0.0.1 -u root --protocol=tcp -D jambones_test < ${__dirname}/db/jambones-sql.sql`);
    execSync(`mysql -h 127.0.0.1 -u root --protocol=tcp -D jambones_test < ${__dirname}/db/populate-test-data2.sql`);

    carrier_sid = await lookupOutboundCarrierForAccount('5f190a4f-b997-4f04-b56e-03c627ea547d');
    //console.log('carrier_sid', carrier_sid)
    t.ok(carrier_sid === '387c1452-620d-4195-9f19-c9814ef90d78', 'finds random outbound carrier at SP level');

    t.end();
  }
  catch (err) {
    t.end(err);
  }
});

