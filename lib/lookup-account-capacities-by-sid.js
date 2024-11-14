const debug = require('debug')('jambonz:db-helpers');
const { QueryTypes } = require('sequelize');

const sql =
`select prod.category, ap.quantity
 from products prod, account_products ap, account_subscriptions subs
 where subs.account_sid = ?
 AND (subs.effective_end_date IS NULL OR subs.effective_end_date > CURDATE() )
 and ap.account_subscription_sid = subs.account_subscription_sid
 and ap.product_sid = prod.product_sid`;

async function lookupAccountSettingsBySid(pool, logger, account_sid) {
  const r = await pool.query(sql, {
    raw: true,
    replacements: [account_sid],
    type: QueryTypes.SELECT
  });
  debug(`results: ${JSON.stringify(r[0])}`);
  return r;
}

module.exports = lookupAccountSettingsBySid;
