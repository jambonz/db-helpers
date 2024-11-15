const test = require('tape').test ;
const config = require('config');
const dialect = process.env.JAMBONES_DB_DIALECT  || 'mysql';
const mysqlOpts = config.get(dialect);

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

test('ms teams tests', async(t) => {
  const fn = require('..');
  const {lookupTeamsByAccount, lookupAllTeamsFQDNs} = fn(mysqlOpts);
  try {
    let obj = await lookupTeamsByAccount('422affb5-4d1e-45e8-b2a4-2623f08b95ef');
    t.ok(obj.ms_teams_fqdn === 'customers.drachtio.org' && obj.tenant_fqdn === 'daveh.customers.drachtio.org', 'looked up ms teams fqdns for account');

    obj = await lookupAllTeamsFQDNs();
    t.ok(obj.length === 1 && obj[0] === 'customers.drachtio.org');

    t.end();
  }
  catch (err) {
    t.end(err);
  }
});

