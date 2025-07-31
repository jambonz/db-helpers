const accountSql = `SELECT * from accounts app, webhooks rh
WHERE app.registration_hook_sid = rh.webhook_sid
AND app.sip_realm = ?`;

const spSql = `SELECT * from service_providers sp, webhooks rh
WHERE sp.registration_hook_sid = rh.webhook_sid
AND sp.root_domain = ?`;

/**
 * Search for authentication webhook first at the account level, by sip domain / realm,
 * if not found then search at the service provider level by root domain
 * @param {*} pool - database pool
 * @param {*} logger - pino logger
 * @param {*} sipRealm - sip realm/domain to search for
 */
async function lookupAuthHook(pool, logger, sipRealm) {
  const pp = pool.promise();
  const [r] = await pp.execute({sql: accountSql, nestTables: true}, [sipRealm]);
  if (r.length > 0 && r[0].rh) {
    return r[0].rh;
  }

  /**
   * if we have no account with that sip realm, and it has subdomains,
   * then check the higher-level domain
   */
  const parts = sipRealm.split('.');
  if (parts.length > 2) {
    parts.shift();
    const superDomain = parts.join('.');
    const [r] = await pp.execute({sql: accountSql, nestTables: true}, [superDomain]);
    if (r.length > 0 && r[0].rh) {
      return r[0].rh;
    }
  }

  const arr = /([^\.]+\.[^\.]+)$/.exec(sipRealm);
  if (!arr) return null;

  const rootDomain = arr[1];
  const [r2] = await pp.execute({sql: spSql, nestTables: true}, [rootDomain]);
  if (r2.length > 0 && r2[0].rh) {
    return r2[0].rh;
  }
  return null;
}

module.exports = lookupAuthHook;
