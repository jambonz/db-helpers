const test = require('tape').test ;
const config = require('config');
const dialect = process.env.JAMBONES_DB_DIALECT  || 'mysql';
const mysqlOpts = config.get(dialect);

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});


test('system_information tests', async(t) => {
  const fn = require('..');
  const {
    lookupSystemInformation
  } = fn(mysqlOpts);
  try {
    let info = await lookupSystemInformation();
    
    t.ok(info.domain_name === 'jambonz.xyz', 'found system information');

    t.end();
  }
  catch (err) {
    t.end(err);
  }
});