const debug = require('debug')('jambonz:db-helpers');
const { QueryTypes } = require('sequelize');
const { v4: uuid } = require('uuid');


const sql = `INSERT into smpp_addresses 
(smpp_address_sid, ipv4) 
values (?, ?)`;

/**
 * Lookup the account by account_sid
 * @param {*} pool
 * @param {*} logger
 */
async function addSmppAddress(pool, logger, ipv4) {
  try {
    debug(`select with ${ipv4}`);
    const r = await pool.query('SELECT * FROM smpp_addresses where ipv4 = ?', {
      raw: true,
      replacements: [ipv4],
      type: QueryTypes.SELECT
    });
    debug(`results from searching for smpp address ${ipv4}: ${JSON.stringify(r)}`);

    if (r.length > 0) return;

    const r2 = await pool.query(sql, {
      replacements: [uuid(), ipv4],
      type: QueryTypes.INSERT
    });

    debug(`results from inserting smpp address ${ipv4}: ${JSON.stringify(r2)}`);
  } catch (err) {
    debug(err);
    logger.error({err}, 'Error adding smpp address to the database');
  }
}

module.exports = addSmppAddress;
