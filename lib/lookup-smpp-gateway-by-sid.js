const debug = require('debug')('jambonz:db-helpers');
const { QueryTypes } = require('sequelize');

const sql =
`SELECT *
FROM smpp_gateways
WHERE smpp_gateway_sid = ?`;

/**
 * Lookup the smpp_gateway by sid
 * @param {*} pool
 * @param {*} logger
 */
async function lookupSmppGatewayBySid(pool, logger, sid) {
  const r = await pool.query(sql, {
    raw: true,
    replacements: [sid],
    type: QueryTypes.SELECT
  });

  debug(`results: ${JSON.stringify(r)}`);
  if (r.length > 0) {
    return r[0];
  }
  return null;
}

module.exports = lookupSmppGatewayBySid;
