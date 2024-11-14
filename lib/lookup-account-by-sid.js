const debug = require('debug')('jambonz:db-helpers');
const { QueryTypes } = require('sequelize');

const sql =
`SELECT *
FROM accounts acc
LEFT JOIN webhooks AS rh ON acc.registration_hook_sid = rh.webhook_sid
WHERE acc.account_sid = ?`;

/**
 * Lookup the account by account_sid
 * @param {*} pool
 * @param {*} logger
 */
async function lookupAccountBySid(pool, logger, account_sid) {
  const r = await pool.query(sql, {
    raw: false,
    nest: true,
    replacements: [account_sid],
    type: QueryTypes.SELECT
  });
  debug(`results: ${JSON.stringify(r)}`);
  if (r.length > 0) {
    const obj = r[0];
    //const obj = r[0].acc;
    //Object.assign(obj, {registration_hook: r[0].rh});
    //if (!obj.registration_hook.url) delete obj.registration_hook;
    logger.debug(`retrieved account: ${JSON.stringify(obj)}`);
    return obj;
  }
  return null;
}

module.exports = lookupAccountBySid;
