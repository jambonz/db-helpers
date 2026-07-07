const sqlAuthCarriersForAccountAndSP = `
  SELECT * FROM voip_carriers
  WHERE trunk_type = 'auth'
  AND is_active = 1
  AND (
    (account_sid = ?)
    OR
    (service_provider_sid = ? AND account_sid IS NULL)
  )`;

/**
 * Look up voip_carriers with trunk_type 'auth' that belong to either:
 * 1. the specified account (account_sid matches), OR
 * 2. the service provider but with a null account_sid (shared across the service provider)
 *
 * @param {*} pool
 * @param {*} logger
 * @param {string} account_sid - the sid of the account
 * @param {string} service_provider_sid - the sid of the service provider
 * @returns {Promise<Array>} array of voip_carrier records matching the criteria
 */
async function lookupAuthCarriersForAccountAndSP(pool, logger, account_sid, service_provider_sid) {
  const pp = pool.promise();
  try {
    const [rows] = await pp.query(sqlAuthCarriersForAccountAndSP, [account_sid, service_provider_sid]);
    return rows;
  } catch (err) {
    logger.error({err, account_sid, service_provider_sid},
      'Error looking up auth carriers for account and service provider');
    throw err;
  }
}

module.exports = lookupAuthCarriersForAccountAndSP;
