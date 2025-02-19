const debug = require('debug')('jambonz:db-helpers');

const sql = 'SELECT * FROM system_information';

async function lookupSystemInformation(pool, logger) {
  const pp = pool.promise();
  const [r] = await pp.query(sql);
  debug(`results: ${JSON.stringify(r)}`);
  return r.length > 0 ? r[0] : null;
}

module.exports = lookupSystemInformation;
