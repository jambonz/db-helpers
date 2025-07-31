const { v4: uuid } = require('uuid');


const sql = `INSERT into sbc_addresses 
(sbc_address_sid, ipv4, port, tls_port, wss_port, last_updated) 
values (?, ?, ?, ?, ?, NOW())`;

const updateSql = `UPDATE sbc_addresses SET port = ?, tls_port = ?, 
wss_port = ?, last_updated = NOW() WHERE sbc_address_sid = ?`;

/**
 * Lookup the account by account_sid
 * @param {*} pool
 * @param {*} logger
 */
async function addSbcAddress(pool, logger, ipv4, port = 5060, tls_port = null, wss_port = null) {
  try {
    const pp = pool.promise();
    const [r] = await pp.execute('SELECT * FROM sbc_addresses where ipv4 = ?', [ipv4]);
    if (r.length > 0) {
      await pp.execute(updateSql, [port, tls_port, wss_port, r[0].sbc_address_sid]);
    } else {
      await pp.execute(sql, [uuid(), ipv4, port, tls_port, wss_port]);
    }
  } catch (err) {
    logger.error({err}, 'Error adding SBC address to the database');
  }
}

module.exports = addSbcAddress;
