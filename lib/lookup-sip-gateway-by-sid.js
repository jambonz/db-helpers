const sql =
`SELECT *
FROM sip_gateways
WHERE sip_gateway_sid = ?`;

/**
 * Lookup the sip_gateway by sid
 * @param {*} pool
 * @param {*} logger
 */
async function lookupSipGatewayBySid(pool, logger, sid) {
  const pp = pool.promise();
  const [r] = await pp.query(sql, [sid]);
  if (r.length > 0) {
    return r[0];
  }
  return null;
}

module.exports = lookupSipGatewayBySid;
