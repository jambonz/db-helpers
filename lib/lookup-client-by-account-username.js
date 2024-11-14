const debug = require('debug')('jambonz:db-helpers');
const { QueryTypes } = require('sequelize');

const sql = 'SELECT * FROM clients WHERE account_sid = ? AND username = ?';
/**
 * Look up client by account sid and username
 * @param {*} pool
 * @param {*} logger
 * @param {*} account_sid
 * @param {*} username
 */
async function lookupClientByAccountAndUsername(pool, logger, account_sid, username) {
  try {
    const client = await pool.query(sql, {
      raw: true,
      replacements: [account_sid, username],
      type: QueryTypes.SELECT
    });
    return client;
  } catch (err) {
    debug(err);
    logger.error({err}, `Error looking up client for account (${account_sid}) and username ${username}`);
  }
}

module.exports = lookupClientByAccountAndUsername;
