const debug = require('debug')('jambonz:db-helpers');
const { QueryTypes } = require('sequelize');

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
  const r = await pool.query(sql, {
    raw: false,
    nest: true,
    replacements: [account_sid],
    type: QueryTypes.SELECT
  });

  debug(`results: ${JSON.stringify(r)}`);
  if (r.length > 0) {
    const obj = r[0];
    logger.debug(`retrieved ms teams info: ${JSON.stringify(obj)}`);
    return obj;
  }
  return null;
}

module.exports = lookupTeamsByAccount;
