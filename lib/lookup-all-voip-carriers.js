// eslint-disable-next-line max-len
const sql = `SELECT * FROM voip_carriers
WHERE account_sid IS NULL
OR account_sid IN (SELECT account_sid FROM accounts WHERE is_active = 1)`;

/**
 * Lookup all voip_carriers
 * @param {*} pool
 * @param {*} logger
 * @param {*} sip_realm
 */
async function lookupAllVoipCarriers(pool, logger) {
  const pp = pool.promise();
  const [r] = await pp.execute(sql);
  return r;
}

module.exports = lookupAllVoipCarriers;
