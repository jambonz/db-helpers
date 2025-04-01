const debug = require('debug')('jambonz:db-helpers');
const { QueryTypes } = require('sequelize');
const sql = 'SELECT * FROM sip_gateways WHERE voip_carrier_sid = ?';

/**
 * Lookup all sip gateways for a voip_carriers
 * @param {*} pool
 * @param {*} logger
 * @param {*} sip_realm
 */
async function lookupSipGatewaysByCarrier(pool, logger, voip_carrier_sid) {
  const r = await pool.query(sql, {
    raw: true,
    replacements: [voip_carrier_sid],
    type: QueryTypes.SELECT
  });
  debug(`results: ${JSON.stringify(r)}`);
  return r;
}

module.exports = lookupSipGatewaysByCarrier;
