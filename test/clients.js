const test = require('tape').test ;
const config = require('config');
const dialect = process.env.JAMBONES_DB_DIALECT  || 'mysql';
const mysqlOpts = config.get(dialect);
const {execSync} = require('child_process');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});


test('clients tests', async(t) => {
  const fn = require('..');
  const {
    lookupClientByAccountAndUsername
  } = fn(mysqlOpts);
  try {
    let client = await lookupClientByAccountAndUsername('ee9d7d49-b3e4-4fdb-9d66-661149f717e8', 'client1');
    t.ok(client.length === 1, 'find client by account and username');

    t.end();
  }
  catch (err) {
    t.end(err);
  }
});