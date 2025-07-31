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
  const pp = pool.promise();
  const [r] = await pp.execute({sql, nestTables: true}, [sip_realm]);
  if (r.length > 0) {
    const obj = r[0].app;
    Object.assign(obj, {call_hook: r[0].ch, call_status_hook: r[0].sh});
    if (!obj.call_hook.url) delete obj.call_hook;
    if (!obj.call_status_hook.url) delete obj.call_status_hook;
    return obj;
  }
  return null;
}

module.exports = lookupAppByRealm;
