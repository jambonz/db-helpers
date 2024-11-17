const test = require('tape').test ;
const config = require('config');
const dialect = process.env.JAMBONES_DB_DIALECT  || 'mysql';
const mysqlOpts = config.get(dialect);
const writeMysqlOpts = config.get(`write-${dialect}`);

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

test('add sbc address tests', async(t) => {
  const fn = require('..');
  const {addSbcAddress, addSmppAddress, lookUpSbcAddressesbyIpv4, cleanSbcAddresses} = fn(mysqlOpts, null, writeMysqlOpts);
  try {
    await addSbcAddress('3.3.3.3', 5060, 5070, 5080);
    t.pass('added sbc address');
    const [first] = await lookUpSbcAddressesbyIpv4('3.3.3.3')
    t.ok(first.port === 5060, 'sbc address port is added');
    t.ok(first.tls_port === 5070, 'sbc address tls_port is added');
    t.ok(first.wss_port === 5080, 'sbc address wss_port is added');

    await new Promise(resolve => setTimeout(resolve, 1000));
    await addSbcAddress('3.3.3.3', 5070, 5083, 5084);

    const [second] = await lookUpSbcAddressesbyIpv4('3.3.3.3');
    t.ok(second.port === 5070, 'sbc address port is updated');
    t.ok(second.tls_port === 5083, 'sbc address tls_port is updated');
    t.ok(second.wss_port === 5084, 'sbc address wss_port is updated');
    t.pass('no need to add if it exists');
    const [readd] = await lookUpSbcAddressesbyIpv4('3.3.3.3')
    t.ok(readd.last_updated > first.last_updated, "last_updated is updated");

    process.env.DEAD_SBC_IN_SECOND = 1;
    await new Promise(resolve => setTimeout(resolve, 2000));
    await cleanSbcAddresses();
    const cleanSbc = await lookUpSbcAddressesbyIpv4('3.3.3.3');
    t.ok(cleanSbc.length == 0, "Successfully clean up SBC address");
    process.env.DEAD_SBC_IN_SECOND = null;

    await addSmppAddress('3.3.3.3');
    t.pass('added smpp address');

    await addSmppAddress('3.3.3.3');
    t.pass('no need to add if it exists');

    t.end();
  }
  catch (err) {
    t.end(err);
  }
});

