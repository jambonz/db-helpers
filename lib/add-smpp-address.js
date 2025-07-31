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
    const pp = pool.promise();
    const [r] = await pp.execute('SELECT * FROM smpp_addresses where ipv4 = ?', [ipv4]);
    if (r.length > 0) return;
    await pp.execute(sql, [uuid(), ipv4]);
  } catch (err) {
    logger.error({err}, 'Error adding smpp address to the database');
  }
}

module.exports = addSmppAddress;
