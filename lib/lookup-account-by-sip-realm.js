const sql =
`SELECT *
FROM accounts acc
LEFT JOIN webhooks AS rh ON acc.registration_hook_sid = rh.webhook_sid
WHERE acc.sip_realm = ?`;

/**
 * Lookup the account by sip_realm
 * @param {*} pool
 * @param {*} logger
 */
async function lookupAccountBySipRealm(pool, logger, realm) {
  const pp = pool.promise();
  const [r] = await pp.execute({sql, nestTables: true}, [realm]);
  if (r.length > 0) {
    const obj = r[0].acc;
    Object.assign(obj, {registration_hook: r[0].rh});
    if (!obj.registration_hook.url) delete obj.registration_hook;
    //logger.debug(`retrieved account: ${JSON.stringify(obj)}`);
    return obj;
  }

  /**
   * if we have no account with that sip realm, and it has subdomains,
   * then check the higher-level domain
   */
  const arr = realm.split('.');
  if (arr.length > 2) {
    arr.shift();
    const superDomain = arr.join('.');
    const [r] =  await pp.execute({sql, nestTables: true}, [superDomain]);
    if (r.length === 1) {
      const obj = r[0].acc;
      Object.assign(obj, {registration_hook: r[0].rh});
      if (!obj.registration_hook.url) delete obj.registration_hook;
      //logger.debug(`retrieved account: ${JSON.stringify(obj)}`);
      return obj;
    }
  }

  return null;
}

module.exports = lookupAccountBySipRealm;
