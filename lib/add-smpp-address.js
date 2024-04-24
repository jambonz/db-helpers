const debug = require('debug')('jambonz:db-helpers');
const { randomUUID: uuid } = require('node:crypto');


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
    debug(`select with ${ipv4}`);
    const [r] = await pp.execute('SELECT * FROM smpp_addresses where ipv4 = ?', [ipv4]);
    debug(`results from searching for smpp address ${ipv4}: ${JSON.stringify(r)}`);
    if (r.length > 0) return;
    const [r2] = await pp.execute(sql, [uuid(), ipv4]);
    debug(`results from inserting smpp address ${ipv4}: ${JSON.stringify(r2)}`);
  } catch (err) {
    debug(err);
    logger.error({err}, 'Error adding smpp address to the database');
  }
}

module.exports = addSmppAddress;
