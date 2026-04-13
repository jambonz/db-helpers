const debug = require('debug')('jambonz:db-helpers');

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
  const pp = pool.promise();
  const [r] = await pp.query(sql, [voip_carrier_sid]);
  debug(`results: ${JSON.stringify(r)}`);
  if (r.length > 0) {
    return r[0];
  }
  return null;
}

module.exports = lookupCarrierBySid;
