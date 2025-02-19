const debug = require('debug')('jambonz:db-helpers');
const { QueryTypes } = require('sequelize');
/**
 * Lookup sip gateways by arbitrary filters
 * @param {mysql.Pool} pool
 * @param {Object} logger
 * @param {Object} filters - An object of column names and values to filter on.
 */
async function lookupSipGatewaysByFilters(pool, logger, filters) {

  let sql = 'SELECT * FROM sip_gateways WHERE ';
  const replacements = [];
  for (const [key, value] of Object.entries(filters)) {
    sql += `${key} = ? AND `;
    replacements.push(value);
  }

  // Remove trailing ' AND '
  sql = sql.slice(0, -5);

  const r = await pool.query(sql, {
    raw: true,
    replacements,
    type: QueryTypes.SELECT
  });

  debug(`results: ${JSON.stringify(r)}`);
  return r;
}

module.exports = lookupSipGatewaysByFilters;
