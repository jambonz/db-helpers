const debug = require('debug')('jambonz:db-helpers');
const { QueryTypes } = require('sequelize');

const sql =
`SELECT *
FROM applications app
LEFT JOIN webhooks AS ch ON app.call_hook_sid = ch.webhook_sid
LEFT JOIN webhooks AS sh ON app.call_status_hook_sid = sh.webhook_sid
WHERE application_sid = (
  SELECT application_sid 
  FROM ms_teams_tenants
  WHERE tenant_fqdn = ?
)`;

/**
 * Lookup the application by ms teams tenant
 * @param {*} pool
 * @param {*} logger
 * @param {*} sip_realm
 */
async function lookupAppByTeamsTenant(pool, logger, tenant_fqdn) {
  const r = await pool.query(sql, {
    raw: true,
    nest: true,
    replacements: [tenant_fqdn],
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

module.exports = lookupAppByTeamsTenant;
