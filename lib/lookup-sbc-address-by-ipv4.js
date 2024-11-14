const debug = require('debug')('jambonz:db-helpers');
const { QueryTypes } = require('sequelize');

const sql = 'SELECT * FROM sbc_addresses where ipv4 = ?';

/**
 * Lookup the account by account_sid
 * @param {*} pool
 * @param {*} logger
 */
async function lookUpSbcAddressesbyIpv4(pool, logger, ipv4) {
  try {
    debug(`select with ${ipv4}`);
    const r = await pool.query(sql, {
      raw: true,
      replacements: [ipv4],
      type: QueryTypes.SELECT
    });
    debug(`results from searching for sbc address ${ipv4}: ${JSON.stringify(r)}`);
    return r;
  } catch (err) {
    debug(err);
    logger.error({err}, 'Error adding SBC address to the database');
  }
}

module.exports = lookUpSbcAddressesbyIpv4;
