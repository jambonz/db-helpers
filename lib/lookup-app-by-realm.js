const debug = require('debug')('jambonz:db-helpers');
const { QueryTypes } = require('sequelize');

const sql =
`SELECT *
FROM applications app
LEFT JOIN webhooks AS ch ON app.call_hook_sid = ch.webhook_sid
LEFT JOIN webhooks AS sh ON app.call_status_hook_sid = sh.webhook_sid
WHERE application_sid = (
  SELECT device_calling_application_sid 
  FROM accounts
  WHERE sip_realm = ?
)`;

/**
 * Lookup the application by sip realm
 * @param {*} pool
 * @param {*} logger
 * @param {*} sip_realm
 */
async function lookupAppByRealm(pool, logger, sip_realm) {
  const r = await pool.query(sql, {
    raw: true,
    nest: true,
    replacements: [sip_realm],
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

module.exports = lookupAppByRealm;
