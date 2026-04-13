const sql = 'SELECT * FROM sip_gateways WHERE voip_carrier_sid = ?';

/**
 * Lookup all sip gateways for a voip_carriers
 * @param {*} pool
 * @param {*} logger
 * @param {*} sip_realm
 */
async function lookupSipGatewaysByCarrier(pool, logger, voip_carrier_sid) {
  const pp = pool.promise();
  const [r] = await pp.query(sql, [voip_carrier_sid]);
  return r;
}

module.exports = lookupSipGatewaysByCarrier;
