const test = require('tape').test ;
const config = require('config');
const dialect = process.env.JAMBONES_DB_DIALECT  || 'mysql';
const mysqlOpts = config.get(dialect);

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

test('call query tests', async(t) => {
  const fn = require('..');
  const {
    queryCallLimits
  } = fn(mysqlOpts);
  try {
    let results = await queryCallLimits('7e306626-4ee9-471b-af8d-27d9f6042fc9', '422affb5-4d1e-45e8-b2a4-2623f08b95ef');
    t.ok(results.account_limit === 10 && results.sp_limit === 100, 'successfully queried call limits');
    t.pass('limits queried');
    t.end();
  }
  catch (err) {
    t.end(err);
  }
});

