const sql = 'SELECT * FROM clients WHERE account_sid = ? AND username = ?';
/**
 * Look up client by account sid and username
 * @param {*} pool
 * @param {*} logger
 * @param {*} account_sid
 * @param {*} username
 */
async function lookupClientByAccountAndUsername(pool, logger, account_sid, username) {
  const pp = pool.promise();
  try {
    const [client] = await pp.query(sql, [account_sid, username]);
    return client;
  } catch (err) {
    logger.error({err}, `Error looking up client for account (${account_sid}) and username ${username}`);
  }
}

module.exports = lookupClientByAccountAndUsername;
