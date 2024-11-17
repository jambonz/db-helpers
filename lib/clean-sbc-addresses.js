const debug = require('debug')('jambonz:db-helpers');
const { QueryTypes } = require('sequelize');
const dialect = process.env.JAMBONES_DB_DIALECT  || 'mysql';
/**
 * Clean the sbc address after long time no update
 * @param {*} pool
 * @param {*} logger
 * @param {*} ipv4 SBC IP Address
 */
async function cleanSbcAddresses(pool, logger) {
  try {
    let sql;
    if (dialect == 'mysql') {
      sql = `DELETE FROM sbc_addresses WHERE last_updated IS NULL OR
        last_updated < DATE_SUB(NOW(), INTERVAL  '${process.env.DEAD_SBC_IN_SECOND || 3600}' SECOND)`;
    } else {
      sql = `DELETE FROM sbc_addresses WHERE last_updated IS NULL OR 
     last_updated < NOW() - INTERVAL '${process.env.DEAD_SBC_IN_SECOND || 3600} second'`;
    }


    const r = await pool.query(sql, { type: QueryTypes.DELETE });
    debug(`results from cleaning for sbc address ${JSON.stringify(r)}`);
  } catch (err) {
    debug(err);
    logger.error({err}, 'Error cleaning SBC address to the database');
  }
}

module.exports = cleanSbcAddresses;
