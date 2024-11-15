const test = require('tape').test ;
const config = require('config');
const dialect = process.env.JAMBONES_DB_DIALECT  || 'mysql';
const mysqlOpts = config.get(dialect);

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

test('lookup auth hook tests', async(t) => {
  const fn = require('..');
  const {lookupAuthHook} = fn(mysqlOpts);
  try {
    let result = await lookupAuthHook('customerA.mycompany.com');
    //console.log(`result: ${JSON.stringify(result)}`);
    t.ok(result.url === 'http://example.com/accountreg', 'looks up auth hook at account level');
    result = await lookupAuthHook('subdomain.example.com');
    t.ok(result.url === 'http://example.com/spreg', 'looks up auth hook at service provider level');
    result = await lookupAuthHook('customerB.mycompany.com');
    //console.log(`result: ${JSON.stringify(result)}`);
    t.ok(result.url === 'http://example.com/accountreg', 'looks up auth hook at account level using root domain');    
    
    result = await lookupAuthHook('subdomain.drachtio.org');
    //console.log(`result: ${JSON.stringify(result)}`);
    t.ok(result.url === 'http://example.com/spreg' && result.username === 'foo', 
      'looks up auth hook that has basic auth info');
    result = await lookupAuthHook('subdomain.none.org');
    t.ok(result === null, 'returns null if none found');

    
    t.end();
  }
  catch (err) {
    console.error(err);
    t.end(err);
  }
});

