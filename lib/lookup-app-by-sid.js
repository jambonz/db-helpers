const debug = require('debug')('jambonz:db-helpers');
const { QueryTypes } = require('sequelize');
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
  const r = await pool.query(sql, {
    raw: true,
    nest: true,
    replacements: [application_sid],
    type: QueryTypes.SELECT
  });
  debug(`results: ${JSON.stringify(r)}`);
  if (r.length > 0) {
    const obj = r[0];
    debug(`retrieved application: ${JSON.stringify(obj)}`);
    return obj;
  }
  return null;
}

module.exports = lookupAppBySid;
