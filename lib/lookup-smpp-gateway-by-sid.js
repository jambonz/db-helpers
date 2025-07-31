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
  const pp = pool.promise();
  const [r] = await pp.execute(sql, [sid]);
  if (r.length > 0) {
    return r[0];
  }
  return null;
}

module.exports = lookupSmppGatewayBySid;
