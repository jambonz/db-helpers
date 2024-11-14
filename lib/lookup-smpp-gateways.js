const { QueryTypes } = require('sequelize');

const sqlAccount = `
SELECT sg.smpp_gateway_sid, sg.voip_carrier_sid, sg.ipv4, sg.port, sg.is_primary, sg.use_tls,  
vc.name, vc.smpp_system_id, vc.smpp_password, sg.inbound, sg.outbound   
FROM smpp_gateways sg, voip_carriers vc
WHERE sg.voip_carrier_sid = vc.voip_carrier_sid
AND vc.is_active = 1 
AND vc.account_sid = ? 
ORDER BY sg.is_primary DESC
`;
const sqlServiceProvider = `
SELECT sg.smpp_gateway_sid, sg.voip_carrier_sid, sg.ipv4, sg.port, sg.is_primary, sg.use_tls,  
vc.name, vc.smpp_system_id, vc.smpp_password, sg.inbound, sg.outbound   
FROM smpp_gateways sg, voip_carriers vc
WHERE sg.voip_carrier_sid = vc.voip_carrier_sid
AND vc.is_active = 1 
AND vc.service_provider_sid = (SELECT service_provider_sid from accounts where account_sid = ?)  
ORDER BY sg.is_primary DESC
`;

/**
 * Lookup the smpp gateways for an account or service_provider
 * @param {*} pool
 * @param {*} logger
 */
async function lookupSmppGateways(pool, logger, account_sid) {
  const r = await pool.query(sqlAccount, {
    raw: true,
    nest: true,
    replacements: [account_sid],
    type: QueryTypes.SELECT
  });
  if (r.length > 0) return r;

  const r2 = await pool.query(sqlServiceProvider, {
    raw: true,
    nest: true,
    replacements: [account_sid],
    type: QueryTypes.SELECT
  });
  return r2;
}

module.exports = lookupSmppGateways;
