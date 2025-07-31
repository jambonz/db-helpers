const sql =
`SELECT *
FROM ms_teams_tenants mtt
LEFT JOIN service_providers AS sp ON mtt.service_provider_sid = sp.service_provider_sid
WHERE mtt.account_sid = ?`;

/**
 * Lookup the teams tenant by account_sid
 * @param {*} pool
 * @param {*} logger
 */
async function lookupTeamsByAccount(pool, logger, account_sid) {
  const pp = pool.promise();
  const [r] = await pp.execute({sql, nestTables: true}, [account_sid]);
  if (r.length > 0) {
    const obj = r[0].mtt;
    Object.assign(obj, {ms_teams_fqdn: r[0].sp.ms_teams_fqdn});
    logger.debug(`retrieved ms teams info: ${JSON.stringify(obj)}`);
    return obj;
  }
  return null;
}

module.exports = lookupTeamsByAccount;
