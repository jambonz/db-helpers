/**
 * Update a sip gateway given its sid and an object of values.
 * @param {mysql.Pool} pool
 * @param {Object} logger
 * @param {string} sip_gateway_sid - The sid of the gateway to update.
 * @param {Object} values - An object where each key-value pair represents a column name and a new value.
 */
async function updateSipGatewayBySid(pool, logger, sip_gateway_sid, values) {
  const pp = pool.promise();

  // Begin building the SQL query string and parameters.
  let sql = 'UPDATE sip_gateways SET ';
  const params = [];
  for (const [key, value] of Object.entries(values)) {
    sql += `${key} = ?, `;
    params.push(value);
  }

  // Remove trailing comma and space
  sql = sql.slice(0, -2);

  // Add WHERE clause
  sql += ' WHERE sip_gateway_sid = ?';
  params.push(sip_gateway_sid);

  const [r] = await pp.execute(sql, params);
  return r;
}

module.exports = updateSipGatewayBySid;
