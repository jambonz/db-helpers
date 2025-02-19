const test = require('tape').test;
const sinon = require('sinon');
const FakeTimers = require("@sinonjs/fake-timers");
const config = require('config');
const {cache} = require('../lib/cache-manager');
const cacheActivator = require('../lib/cache-activator');
const dialect = process.env.JAMBONES_DB_DIALECT  || 'mysql';
const mysqlOpts = config.get(dialect);

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});


let clock;

test('cache tests', async(t) => {

  if(dialect != 'mysql'){
    return t.end();
  }


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

  async function execute1000() {
    for (let i = 0; i < 1000; i++) {
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

  async function query1000() {
    for (let i = 0; i < 1000; i++) {
      const pp = pool.promise();
      const [r] = await pp.query(
        {sql: 'SELECT application_sid from voip_carriers where voip_carrier_sid = ?'}, 
        ['3b43e39f-4346-4218-8434-a53130e8be49']
      );

      if (!queryFixture) {
        queryFixture = JSON.stringify(r[0]);
      }
      else if (JSON.stringify(r[0]) !== queryFixture) {
        allCachedMatchOriginal = false;
      }
    }
  }

  try {
    await execute1000();
    await query1000();

    t.ok(spies.execute.calledOnce && spies.query.calledOnce, 'calls database only 1 / 1000');

    await clock.tickAsync(25000);

    await execute1000();
    await query1000();

    t.ok(spies.execute.calledOnce && spies.query.calledOnce, 'remains in cache after 25sec');

    await clock.tickAsync(5000);

    t.ok(spies.execute.calledTwice && spies.query.calledTwice, 'background refreshes from db and caches again after TTL 30sec');
    t.ok(allCachedMatchOriginal, 'all cached results match db originals');

    await clock.tickAsync(10000);

    await execute1000();
    await query1000();

    t.ok(spies.execute.calledTwice && spies.query.calledTwice, 'remains in cache before next TTL 30sec');

    for (let i = 0; i < 2000; i++) {
      await clock.tickAsync(25);
    }

    t.ok(Object.keys(cache).length === 0, 'cache items purged if not accessed within TTL 30sec');

    t.end();
  }
  catch (err) {
    t.end(err);
  }
});

