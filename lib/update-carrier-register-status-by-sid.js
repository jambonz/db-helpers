const sql = 'UPDATE voip_carriers SET register_status = ? where voip_carrier_sid = ?';

/**
 * Update voip_carriers register status
 * @param {*} pool
 * @param {*} logger
 * @param {*} value a json {status: 'fail', reason: '408 timeout'}
 */
async function updateVoipCarriersRegisterStatus(pool, logger, sid, value) {
  try {
    const pp = pool.promise();
    await pp.query(sql, [typeof value === 'object' ? JSON.stringify(value) : value, sid]);
  } catch (err) {
    logger.error({err}, 'Error updating Voip Carriers Register Status to the database');
  }
}

module.exports = updateVoipCarriersRegisterStatus;
