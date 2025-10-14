const test = require('tape').test;
const sinon = require('sinon');
const FakeTimers = require("@sinonjs/fake-timers");
const config = require('config');
const {cache} = require('../lib/cache-manager');
const cacheActivator = require('../lib/cache-activator');
const mysqlOpts = config.get('mysql');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});


let clock;

test('cache tests', async(t) => {
  clock = FakeTimers.install();

  const fn = require('..');
  const {pool} = fn(mysqlOpts);

  const spies = {
    execute: sinon.spy(),
    query: sinon.spy()
  }

  const testPromise = pool.promise;
  pool.promise = function () {
    const pp = testPromise.apply(pool, arguments);
    ['execute', 'query'].forEach(function (fnName) {
      const fn = pp[fnName];
      pp[fnName] = async function () {
        spies[fnName]();
        return await fn.apply(pp, arguments);
      };

    });
    return pp;
  }

  process.env.JAMBONES_MYSQL_REFRESH_TTL = '30';
  cacheActivator.activate(pool);

  t.teardown(function () {
    clock.uninstall();
    cacheActivator.deactivate(pool);
  });

  let executeFixture;
  let queryFixture;
  let allCachedMatchOriginal = true;

  async function execute(count) {
    for (let i = 0; i < count; i++) {
      const pp = pool.promise();
      const [r] = await pp.execute(`SELECT * FROM voip_carriers WHERE voip_carrier_sid = ?`, ['287c1452-620d-4195-9f19-c9814ef90d78']);

      if (!executeFixture) {
        executeFixture = JSON.stringify(r[0]);
      }
      else if (JSON.stringify(r[0]) !== executeFixture) {
        allCachedMatchOriginal = false;
      }
    }
  }

  async function query(count) {
    for (let i = 0; i < count; i++) {
      const pp = pool.promise();
      const [r] = await pp.query(
        {sql: 'SELECT application_sid from voip_carriers where voip_carrier_sid = ?'}, 
        ['287c1452-620d-4195-9f19-c9814ef90d78']
      );

      if (!queryFixture) {
        queryFixture = JSON.stringify(r[0]);
      }
      else if (JSON.stringify(r[0]) !== queryFixture) {
        allCachedMatchOriginal = false;
      }
    }
  }

  async function checkCache() {
    const keys = Object.keys(cache)
    if (keys.length != 0) {
      keys.forEach((k) => {console.log(k, cache[k].timestamp)})
    } else {
      console.log('Empty Cache')
    }
  }

  try {
    
    // Test 1 Basic Caching
    //await checkCache();
    await execute(1000);
    await query(1000);
    //await checkCache();
    t.ok(spies.execute.calledOnce && spies.query.calledOnce, 'calls database only 1 / 1000');

    // Test 2 Cache Persistence
    await clock.tickAsync(15000);
    await execute(1000);
    await query(1000);
    t.ok(spies.execute.calledOnce && spies.query.calledOnce, 'remains in cache after 15sec');

    // Test 3 Cache Expiry
    await clock.tickAsync(16000);
    //await checkCache();
    t.ok(Object.keys(cache).length === 0, 'cache items purged after TTL 30sec');

    // Test 4 Re-Cache
    await execute(1000);
    await query(1000);
    //await checkCache();
    t.ok(spies.execute.calledTwice && spies.query.calledTwice, 'Fetch from db and caches again after TTL 30sec');
    
    // Test 5 Cache Accuracy
    t.ok(allCachedMatchOriginal, 'all cached results match db originals');
     
    // Test 6 Update DB
    const pp = pool.promise();
    let [r] = await pp.query({sql: 'SELECT name from voip_carriers where voip_carrier_sid = ?'}, ['287c1452-620d-4195-9f19-c9814ef90d78']);
    console.log(r[0].name)
    t.ok(r[0].name == 'westco', 'correct value in database')
    await pp.query({sql: 'UPDATE voip_carriers SET name = "newco" WHERE voip_carrier_sid = ?'}, ['287c1452-620d-4195-9f19-c9814ef90d78']);
    [r] = await pp.query({sql: 'SELECT name from voip_carriers where voip_carrier_sid = ?'}, ['287c1452-620d-4195-9f19-c9814ef90d78']);
    t.ok(r[0].name == 'westco', 'old value in cache after update')
    await clock.tickAsync(30000);
    [r] = await pp.query({sql: 'SELECT name from voip_carriers where voip_carrier_sid = ?'}, ['287c1452-620d-4195-9f19-c9814ef90d78']);
    t.ok(r[0].name == 'newco', 'new value in cache after expiry')
    await pp.query({sql: 'UPDATE voip_carriers SET name = "westco" WHERE voip_carrier_sid = ?'}, ['287c1452-620d-4195-9f19-c9814ef90d78']); //Put DB back to original
    t.end();
  }
  catch (err) {
    t.end(err);
  }
});

