const sqlCallRoutes =
`SELECT regex, application_sid
FROM call_routes 
WHERE account_sid = ?
ORDER BY priority ASC
`;

/**
 * Lookup the application which should be invoked when a call arrives on a phone number
 * @param {*} pool
 * @param {*} logger
 * @param {string} phoneNumber - phone number that was dialed
 * @param {string} account_sid - account_sid
 */
async function lookupAppByRegex(pool, logger, phoneNumber, account_sid) {
  const pp = pool.promise();

  const lookupAppBySid = require('./lookup-app-by-sid').bind(null, pool, logger);

  const [callRoutes] = await pp.execute(sqlCallRoutes, [account_sid]);

  const selectedRoute = callRoutes.find((cr) => RegExp(cr.regex).test(phoneNumber));
  if (selectedRoute) {
    logger.debug({selectedRoute}, `lookupAppByRegex: returning based on regex match for ${phoneNumber}`);
    return await lookupAppBySid(selectedRoute.application_sid);
  }

  return null;
}

module.exports = lookupAppByRegex;
