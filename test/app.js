const test = require('tape').test ;
const config = require('config');
const mysqlOpts = config.get('mysql');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

test('application tests', async(t) => {
  const fn = require('..');
  const {lookupAppByPhoneNumber, lookupAppByRegex, lookupAppBySid, lookupAppByRealm, lookupAppByTeamsTenant, lookupAccountBySid} = fn(mysqlOpts);
  try {
    let app = await lookupAppByPhoneNumber('15083084809');
    //console.log(`app: ${JSON.stringify(app)}`);
    t.ok(app !== null, 'retrieves application for phone number');
    t.ok(app.messaging_hook_sid, 'retrieves messaging hook');

    app = await lookupAppByRegex('+44100100100', '422affb5-4d1e-45e8-b2a4-2623f08b95ef');
    t.ok(app !== null, 'retrieves application by regex');
    
    app = await lookupAppBySid('3b43e39f-4346-4218-8434-a53130e8be49');
    t.ok(app !== null, 'retrieves application by sid');
    
    let account = await lookupAccountBySid('422affb5-4d1e-45e8-b2a4-2623f08b95ef');
    t.ok(account !== null, 'retrieves account by sid');

    app = await lookupAppByRealm('sip.drachtio.org');
    t.ok(app !== null, 'retrieves app by sip realm');

    app = await lookupAppByTeamsTenant('daveh.customers.drachtio.org');
    t.ok(app !== null, 'retrieves app by ms teams tenant');

    t.end();
  }
  catch (err) {
    t.end(err);
  }
});

