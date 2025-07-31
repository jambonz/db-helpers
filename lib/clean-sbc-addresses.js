/**
 * Clean the sbc address after long time no update
 * @param {*} pool
 * @param {*} logger
 * @param {*} ipv4 SBC IP Address
 */
async function cleanSbcAddresses(pool, logger) {
  try {
    const pp = pool.promise();
    const sql = `DELETE FROM sbc_addresses WHERE last_updated IS NULL OR
      last_updated < DATE_SUB(NOW(), INTERVAL 
      '${process.env.DEAD_SBC_IN_SECOND || 3600}' SECOND)`;
    await pp.execute(sql);
  } catch (err) {
    logger.error({err}, 'Error cleaning SBC address to the database');
  }
}

module.exports = cleanSbcAddresses;
