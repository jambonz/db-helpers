const sql = 'SELECT * FROM sbc_addresses where ipv4 = ?';

/**
 * Lookup the account by account_sid
 * @param {*} pool
 * @param {*} logger
 */
async function lookUpSbcAddressesbyIpv4(pool, logger, ipv4) {
  try {
    const pp = pool.promise();
    const [r] = await pp.execute(sql, [ipv4]);
    return r;
  } catch (err) {
    logger.error({err}, 'Error adding SBC address to the database');
  }
}

module.exports = lookUpSbcAddressesbyIpv4;
