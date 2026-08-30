const test = require('tape').test ;
const config = require('config');
const mysqlOpts = config.get('mysql');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

test('add sbc address tests', async(t) => {
  const fn = require('..');
  const {addSbcAddress, lookUpSbcAddressesbyIpv4, cleanSbcAddresses} = fn(mysqlOpts);
  try {
    await addSbcAddress('3.3.3.3', 5060, 5070, 5080);
    t.pass('added sbc address');
    const [first] = await lookUpSbcAddressesbyIpv4('3.3.3.3')
    t.ok(first.port === 5060, 'sbc address port is added');
    t.ok(first.tls_port === 5070, 'sbc address tls_port is added');
    t.ok(first.wss_port === 5080, 'sbc address wss_port is added');

    const firstUpdated = new Date(first.last_updated).getTime();

    await new Promise(resolve => setTimeout(resolve, 1000));
    /* re-registering the same ipv4/port must refresh the existing row rather
       than create a second one: this call IS the SBC keepalive, and
       cleanSbcAddresses() reaps rows whose last_updated has gone stale */
    await addSbcAddress('3.3.3.3', 5060, 5083, 5084);

    const rows = await lookUpSbcAddressesbyIpv4('3.3.3.3');
    t.ok(rows.length === 1, 'no duplicate row created');
    const [second] = rows;
    t.ok(second.sbc_address_sid === first.sbc_address_sid, 'existing row was updated in place');
    t.ok(second.port === 5060, 'sbc address port unchanged');
    t.ok(second.tls_port === 5083, 'sbc address tls_port refreshed');
    t.ok(second.wss_port === 5084, 'sbc address wss_port refreshed');
    t.ok(new Date(second.last_updated).getTime() > firstUpdated,
      'last_updated refreshed, so the cleaner will not reap a live SBC');

    process.env.DEAD_SBC_IN_SECOND = 1;
    await new Promise(resolve => setTimeout(resolve, 2000));
    await cleanSbcAddresses();
    const cleanSbc = await lookUpSbcAddressesbyIpv4('3.3.3.3');
    t.ok(cleanSbc.length == 0, "Successfully clean up SBC address");
    process.env.DEAD_SBC_IN_SECOND = null;

    t.end();
  }
  catch (err) {
    t.end(err);
  }
});

