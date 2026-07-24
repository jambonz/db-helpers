const test = require('tape').test ;
const config = require('config');
const mysqlOpts = config.get('mysql');
const writeMysqlOpts = config.get('write-mysql');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

test('add sbc address tests', async(t) => {
  const fn = require('..');
  const {addSbcAddress, lookUpSbcAddressesbyIpv4, cleanSbcAddresses} = fn(mysqlOpts, null, writeMysqlOpts);
  try {
    await addSbcAddress('3.3.3.3', 5060, 5070, 5080);
    t.pass('added sbc address');
    const [first] = await lookUpSbcAddressesbyIpv4('3.3.3.3')
    t.ok(first.port === 5060, 'sbc address port is added');
    t.ok(first.tls_port === 5070, 'sbc address tls_port is added');
    t.ok(first.wss_port === 5080, 'sbc address wss_port is added');

    await new Promise(resolve => setTimeout(resolve, 1000));
    // Same IP and port is silently ignored (INSERT IGNORE)
    await addSbcAddress('3.3.3.3', 5060, 5083, 5084);

    const [second] = await lookUpSbcAddressesbyIpv4('3.3.3.3');
    t.ok(second.port === 5060, 'sbc address port unchanged');
    t.ok(second.tls_port === 5070, 'sbc address tls_port unchanged (INSERT IGNORE)');
    t.ok(second.wss_port === 5080, 'sbc address wss_port unchanged (INSERT IGNORE)');
    t.pass('duplicate insert silently ignored');

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

