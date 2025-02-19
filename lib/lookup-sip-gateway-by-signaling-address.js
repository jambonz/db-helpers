const debug = require('debug')('jambonz:db-helpers');
const CIDRMatcher = require('cidr-matcher');
const { QueryTypes } = require('sequelize');

const sql = `
SELECT sg.sip_gateway_sid, sg.voip_carrier_sid, vc.name, vc.account_sid, 
vc.application_sid, sg.inbound, sg.outbound, sg.is_active, sg.ipv4, sg.protocol, sg.send_options_ping  
FROM sip_gateways sg, voip_carriers vc
WHERE sg.voip_carrier_sid = vc.voip_carrier_sid
AND port = ?
`;
const sqlExactMatch = `${sql} AND ipv4 = ?`;
const sqlRangeMatch = `${sql} AND ipv4 LIKE '%/%'`;

/**
 * Lookup the configured sip gateway and associated carrier for an ip address and port
 * @param {*} pool
 * @param {*} logger
 * @param {*} ipv4 - ip address
 * @param {*} port - port
 */
async function lookupSipGatewayBySignalingAddress(pool, logger, ipv4, port) {
  const exact = await lookupExact(pool, logger, ipv4, port);
  return exact !== null ? exact : await lookupRange(pool, logger, ipv4, port);
}

async function lookupExact(pool, logger, ipv4, port) {
  const r = await pool.query(sqlExactMatch, {
    raw: true,
    replacements: [port, ipv4],
    type: QueryTypes.SELECT
  });
  debug(`results: ${JSON.stringify(r)}`);
  return r.length === 1 ? r[0] : null;
}

async function lookupRange(pool, logger, ipv4, port) {
  const r = await pool.query(sqlRangeMatch, {
    raw: true,
    replacements: [port],
    type: QueryTypes.SELECT
  });
  debug(`results: ${JSON.stringify(r)}`);
  for (let i = 0; i < r.length; i++) {
    if (new CIDRMatcher([r[i].ipv4]).contains(ipv4)) {
      return r[i];
    }
  }

  return null;
}

module.exports = lookupSipGatewayBySignalingAddress;
