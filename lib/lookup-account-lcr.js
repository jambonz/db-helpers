
const sqlQueryLcrByAccountSid = `SELECT lcr_sid FROM lcr WHERE account_sid = ? OR
  service_provider_sid = (SELECT service_provider_sid from accounts where account_sid = ?)`;

/**
 * Look up lcrs for an account
 * @param {*} pool
 * @param {*} logger
 * @param {*} account_sid
 */
async function lookupLcrByAccount(pool, logger, account_sid) {
  const pp = pool.promise();
  try {
    const [lcrs] = await pp.query(sqlQueryLcrByAccountSid, [account_sid, account_sid]);
    return lcrs;
  } catch (err) {
    logger.error({err}, `Error looking up lcr for account (${account_sid}) `);
  }
}

module.exports = lookupLcrByAccount;
