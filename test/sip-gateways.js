const test = require('tape').test ;
const config = require('config');
const lookupSipGatewaysByFilters = require('../lib/lookup-sip-gateways-by-filters');
const dialect = process.env.JAMBONES_DB_DIALECT  || 'mysql';
const mysqlOpts = config.get(dialect);

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

test('sip gateways tests', async(t) => {
  const fn = require('..');
  const {
    lookupSipGatewayBySignalingAddress,
    lookupSipGatewaysByCarrier,
    lookupSipGatewayBySid,
    lookupSipGatewaysByFilters,
    updateSipGatewayBySid
  } = fn(mysqlOpts);
  try {
    let index = (dialect == 'mysql')? 2 : 1 ; // @todo check if this is bug or feature of postgres
    let gateways = await lookupSipGatewaysByCarrier('287c1452-620d-4195-9f19-c9814ef90d78');
    t.ok(gateways.length === 3 && gateways[index].port === 5062, 'retrieves sip gateways for a voip carrier');

    gateways = await lookupSipGatewaysByFilters({voip_carrier_sid: '287c1452-620d-4195-9f19-c9814ef90d78'});
    console.log(gateways.length, gateways);
    t.ok(gateways.length === 3 && gateways[index].port === 5062, 'retrieves sip gateways for a voip carrier');

    let gateway = await lookupSipGatewayBySignalingAddress('3.3.3.3', 5060);
    //console.log(`gateway: ${JSON.stringify(gateway)}`);
    t.ok(gateway.sip_gateway_sid === '124a5339-c62c-4075-9e19-f4de70a96597', 'retrieves sip gateway with default port');
    t.ok(gateway.send_options_ping === 0, 'retrieves sip gateway with send_options_ping');

    await updateSipGatewayBySid(gateway.sip_gateway_sid, {send_options_ping: 1});

    gateway = await lookupSipGatewayBySignalingAddress('3.3.3.3', 5060);
    console.log(`gateway: ${JSON.stringify(gateway)}`);
    t.ok(gateway.sip_gateway_sid === '124a5339-c62c-4075-9e19-f4de70a96597', 'retrieves sip gateway with default port');
    t.ok(gateway.send_options_ping === 1, 'retrieves sip gateway with send_options_ping');

    gateway = await lookupSipGatewayBySignalingAddress('3.3.3.3', 5062);
    //console.log(`gateway: ${JSON.stringify(gateway)}`);
    t.ok(gateway.sip_gateway_sid === 'efbc4830-57cd-4c78-a56f-d64fdf210fe8', 'retrieves sip gateway with non-default port');

    gateway = await lookupSipGatewayBySignalingAddress('3.3.3.4', 5060);
    //console.log(`gateway: ${JSON.stringify(gateway)}`);
    t.ok(gateway.sip_gateway_sid === '1e674a9a-763d-4247-8a54-b7a56ab6b605', 'retrieves sip gateway with ip range configuration');

    gateway = await lookupSipGatewayBySignalingAddress('3.3.3.5', 5060);
    //console.log(`gateway: ${JSON.stringify(gateway)}`);
    t.ok(gateway.sip_gateway_sid === '1e674a9a-763d-4247-8a54-b7a56ab6b605', 'retrieves sip gateway with the same ip range configuration');

    gateway = await lookupSipGatewayBySignalingAddress('3.3.3.6', 5062);
    //console.log(`gateway: ${JSON.stringify(gateway)}`);
    t.ok(gateway === null, 'returns null when gateway not found');

    gateway = await lookupSipGatewayBySid('efbc4830-57cd-4c78-a56f-d64fdf210fe8');
    t.ok(!!gateway, 'looks up gateway by sid');

    t.end();
  }
  catch (err) {
    t.end(err);
  }
});

