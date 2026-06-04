const { v4: uuid } = require('uuid');

// Use INSERT IGNORE to handle concurrent inserts atomically.
// The UNIQUE INDEX on (ipv4, port) ensures only one row per IP/port combination.
// If a record already exists for this IP/port, the insert is silently skipped.
const insertSql = `INSERT IGNORE INTO sbc_addresses
(sbc_address_sid, ipv4, port, tls_port, wss_port, last_updated)
VALUES (?, ?, ?, ?, ?, NOW())`;

/**
 * Add an SBC address to the database if it doesn't already exist.
 * Uses INSERT IGNORE to handle concurrent registrations atomically.
 * @param {*} pool
 * @param {*} logger
 * @param {string} ipv4 - The IP address
 * @param {number} port - The SIP port (default 5060)
 * @param {number|null} tls_port - The TLS port
 * @param {number|null} wss_port - The WSS port
 */
async function addSbcAddress(pool, logger, ipv4, port = 5060, tls_port = null, wss_port = null) {
  try {
    const pp = pool.promise();
    await pp.execute(insertSql, [uuid(), ipv4, port, tls_port, wss_port]);
  } catch (err) {
    logger.error({err}, 'Error adding SBC address to the database');
  }
}

module.exports = addSbcAddress;
