const test = require('tape').test ;
const config = require('config');
const dialect = process.env.JAMBONES_DB_DIALECT  || 'mysql';
const mysqlOpts = config.get(dialect);

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

test('voip_carriers tests', async(t) => {
  const fn = require('..');
  const {lookupAllVoipCarriers, lookupCarrierBySid, updateVoipCarriersRegisterStatus} = fn(mysqlOpts);
  try {
    let carriers = await lookupAllVoipCarriers();
    //console.log(`carriers: ${JSON.stringify(carriers)}`);
    t.ok(carriers[0].register_username === 'janedoe', 'retrieves voip_carriers');

    let carrier = await lookupCarrierBySid('287c1452-620d-4195-9f19-c9814ef90d78');

    t.ok(carrier && carrier.name === 'westco', 'retrieves voip_carrier by sid');

    const obj = {
      status: 'fail',
      reason: '408 request timeout'
    }

    await updateVoipCarriersRegisterStatus('287c1452-620d-4195-9f19-c9814ef90d78', obj);
    carrier = await lookupCarrierBySid('287c1452-620d-4195-9f19-c9814ef90d78');
    console.log(carrier.register_status);
    const ret = JSON.parse(carrier.register_status);
    t.ok(ret && ret.status === 'fail' && ret.reason === '408 request timeout', 'retrieves voip_carrier.register_status by sid');
  
    t.end();
  }
  catch (err) {
    t.end(err);
  }
});

