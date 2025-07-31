const sqlQueryLcrByAccountSid = `SELECT lcr_sid FROM lcr WHERE account_sid = ? OR
  service_provider_sid = (SELECT service_provider_sid from accounts where account_sid = ?)`;
const sqlQueryLcrRouteByLcrSid = 'SELECT * FROM lcr_routes WHERE lcr_sid = ? ORDER BY priority';
const sqlQueryLcrCarrierSetEntryByLcrRouteSid = `SELECT * FROM lcr_carrier_set_entry 
  WHERE lcr_route_sid = ? ORDER BY priority`;

const checkRegex = (pattern, value) => {
  const matcher = new RegExp(pattern);
  return matcher.test(value);
};

/**
 * Look up voip carrier sid by account sid and number
 * @param {*} pool
 * @param {*} logger
 * @param {*} account_sid
 * @param {*} number
 */
async function lookupCarrierByAccountLcr(pool, logger, account_sid, number) {
  const pp = pool.promise();
  try {
    const [lcrs] = await pp.query(sqlQueryLcrByAccountSid, [account_sid, account_sid]);
    if (lcrs.length) {
      const {lcr_sid} = lcrs[0];
      const [lcr_routes] = await pp.query(sqlQueryLcrRouteByLcrSid, [lcr_sid]);
      if (lcr_routes.length) {
        for (const r of lcr_routes) {
          if (number.startsWith(r.regex) || checkRegex(r.regex, number)) {
            const [entries] = await pp.query(sqlQueryLcrCarrierSetEntryByLcrRouteSid, [r.lcr_route_sid]);
            // Currently just support first entry;
            if (entries.length) {
              return entries[0].voip_carrier_sid;
            }
          }
        }
      }
    }
  } catch (err) {
    logger.error({err}, `Error looking up carrier for account (${account_sid}) lcr and number ${number}`);
  }
}

module.exports = lookupCarrierByAccountLcr;
