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
  const pp = pool.promise();
  const [r] = await pp.execute({sql, nestTables: true}, [tenant_fqdn]);
  if (r.length > 0) {
    const obj = r[0].app;
    Object.assign(obj, {call_hook: r[0].ch, call_status_hook: r[0].sh});
    if (!obj.call_hook.url) delete obj.call_hook;
    if (!obj.call_status_hook.url) delete obj.call_status_hook;
    return obj;
  }
  return null;
}

module.exports = lookupAppByTeamsTenant;
