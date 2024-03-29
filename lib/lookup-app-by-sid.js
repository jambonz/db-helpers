const debug = require('debug')('jambonz:db-helpers');

const sql =
`SELECT *
FROM applications app
LEFT JOIN webhooks AS ch ON app.call_hook_sid = ch.webhook_sid
LEFT JOIN webhooks AS sh ON app.call_status_hook_sid = sh.webhook_sid
LEFT JOIN webhooks AS mh ON app.messaging_hook_sid = mh.webhook_sid
WHERE app.application_sid = ?`;

/**
 * Lookup the application by application_sid
 * @param {*} pool
 * @param {*} logger
 * @param {*} application_sid
 */
async function lookupAppBySid(pool, logger, application_sid) {
  const pp = pool.promise();
  const [r] = await pp.execute({sql, nestTables: true}, [application_sid]);
  debug(`results: ${JSON.stringify(r)}`);
  if (r.length > 0) {
    const obj = r[0].app;
    Object.assign(obj, {call_hook: r[0].ch, call_status_hook: r[0].sh, messaging_hook: r[0].mh});
    if (!obj.call_hook.url) delete obj.call_hook;
    if (!obj.call_status_hook.url) delete obj.call_status_hook;
    if (!obj.messaging_hook.url) delete obj.messaging_hook;
    debug(`retrieved application: ${JSON.stringify(obj)}`);
    return obj;
  }
  return null;
}

module.exports = lookupAppBySid;
