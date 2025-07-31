/**
 * Lookup sip gateways by arbitrary filters
 * @param {mysql.Pool} pool
 * @param {Object} logger
 * @param {Object} filters - An object of column names and values to filter on.
 */
async function lookupSipGatewaysByFilters(pool, logger, filters) {
  const pp = pool.promise();

  let sql = 'SELECT * FROM sip_gateways WHERE ';
  const params = [];
  for (const [key, value] of Object.entries(filters)) {
    sql += `${key} = ? AND `;
    params.push(value);
  }

  // Remove trailing ' AND '
  sql = sql.slice(0, -5);

  const [r] = await pp.execute(sql, params);
  return r;
}

module.exports = lookupSipGatewaysByFilters;
