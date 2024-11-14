const debug = require('debug')('jambonz:db-helpers');
const { QueryTypes } = require('sequelize');

const sql = 'UPDATE voip_carriers SET register_status = ? where voip_carrier_sid = ?';

/**
 * Update voip_carriers register status
 * @param {*} pool
 * @param {*} logger
 * @param {*} value a json {status: 'fail', reason: '408 timeout'}
 **/
async function updateVoipCarriersRegisterStatus(pool, logger, sid, value) {
  try {
    await pool.query(sql, {
      raw: true,
      replacements: [JSON.stringify(value), sid]
    });
  } catch (err) {
    debug(err);
    logger.error({err}, 'Error updating Voip Carriers Register Status to the database');
  }
}

module.exports = updateVoipCarriersRegisterStatus;
