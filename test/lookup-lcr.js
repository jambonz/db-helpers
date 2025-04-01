const test = require('tape').test ;
const config = require('config');
const dialect = process.env.JAMBONES_DB_DIALECT  || 'mysql';
const mysqlOpts = config.get(dialect);

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

test('lookup lcr test', async(t) => {
  const fn = require('..');
  const {
    lookupCarrierByAccountLcr
  } = fn(mysqlOpts);
  try {
    let voip_carrier_sid = await lookupCarrierByAccountLcr('ee9d7d49-b3e4-4fdb-9d66-661149f717e8', '445566');
    t.ok(voip_carrier_sid === '287c1452-620d-4195-9f19-c9814ef90d78', 'Successfully query carrier by account');
    let voip_carrier_sid2 = await lookupCarrierByAccountLcr('ee9d7d49-b3e4-4fdb-9d66-661149f717e8', '345566');
    t.ok(!voip_carrier_sid2, 'Successfully query carrier' );

    let voip_carrier_sid3 = await lookupCarrierByAccountLcr('5f190a4f-b997-4f04-b56e-03c627ea547d', '33445566');
    t.ok(voip_carrier_sid3 === '287c1452-620d-4195-9f19-c9814ef90d78', 'Successfully query carrier by service provider');
    let voip_carrier_sid4 = await lookupCarrierByAccountLcr('5f190a4f-b997-4f04-b56e-03c627ea547d', '223344');
    t.ok(!voip_carrier_sid4, 'Successfully query carrier' );
    t.end();
  }
  catch (err) {
    t.end(err);
  }
});

