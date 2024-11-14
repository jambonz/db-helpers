const debug = require('debug')('jambonz:db-helpers');
const { QueryTypes } = require('sequelize');

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
  const r = await pool.query(accountSql, {
    raw: true,
    nest: true,
    type: QueryTypes.SELECT,
    replacements: [sipRealm]
  });
  debug(`results from querying account for sip realm ${sipRealm}: ${JSON.stringify(r)}`);
  if (r.length) {
    return r[0];
  }

  /**
   * if we have no account with that sip realm, and it has subdomains,
   * then check the higher-level domain
   */
  const parts = sipRealm.split('.');
  debug(`did not find sip realm ${sipRealm}, parts ${parts}`);
  if (parts.length > 2) {
    parts.shift();
    const superDomain = parts.join('.');
    const r = await pool.query(accountSql, {
      nest: true,
      type: QueryTypes.SELECT,
      replacements: [superDomain]
    });
    debug(`results from querying account for sip realm ${superDomain}: ${JSON.stringify(r)}`);
    if (r.length > 0) {
      return r[0];
    }
  }

  const arr = /([^\.]+\.[^\.]+)$/.exec(sipRealm);
  if (!arr) return null;

  const rootDomain = arr[1];
  debug(`did not find hook at account level, checking service provider for ${rootDomain}`);
  const r2 = await pool.query(spSql, {
    nest: true,
    type: QueryTypes.SELECT,
    replacements: [rootDomain]
  });
  debug(`results from querying service_providers for root domain ${rootDomain}: ${JSON.stringify(r2)}`);
  if (r2.length > 0) {
    return r2[0];
  }
  return null;
}

module.exports = lookupAuthHook;
