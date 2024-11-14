const debug = require('debug')('jambonz:db-helpers');
const { QueryTypes } = require('sequelize');

const sql =
`SELECT *
FROM voip_carriers
WHERE voip_carrier_sid = ?`;

/**
 * Lookup the carrier by voip_carrier_sid
 * @param {*} pool
 * @param {*} logger
 */
async function lookupCarrierBySid(pool, logger, voip_carrier_sid) {
  const r = await pool.query(sql, {
    raw: true,
    replacements: [voip_carrier_sid],
    type: QueryTypes.SELECT
  });
  debug(`results: ${JSON.stringify(r)}`);
  if (r.length > 0) {
    return r[0];
  }
  return null;
}

module.exports = lookupCarrierBySid;
