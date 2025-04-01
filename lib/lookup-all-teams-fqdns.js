const debug = require('debug')('jambonz:db-helpers');
const { QueryTypes } = require('sequelize');

const sql =
`SELECT distinct ms_teams_fqdn
FROM service_providers
WHERE ms_teams_fqdn IS NOT NULL`;

/**
 * Lookup all configured teams fqdns
 * @param {*} pool
 * @param {*} logger
 */
async function lookupAllTeamsFQDNs(pool, logger) {
  const r = await pool.query(sql, {
    raw: true,
    type: QueryTypes.SELECT
  });
  debug(`results: ${JSON.stringify(r)}`);
  return r.map((row) => row.ms_teams_fqdn);
}

module.exports = lookupAllTeamsFQDNs;
