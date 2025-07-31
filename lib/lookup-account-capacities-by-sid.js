const sql =
`select prod.category, ap.quantity
 from products prod, account_products ap, account_subscriptions subs
 where subs.account_sid = ?
 and subs.pending = 0
 AND (subs.effective_end_date IS NULL OR subs.effective_end_date > NOW() )
 and ap.account_subscription_sid = subs.account_subscription_sid
 and ap.product_sid = prod.product_sid`;

async function lookupAccountSettingsBySid(pool, logger, account_sid) {
  const pp = pool.promise();
  const [r] = await pp.query(sql, [account_sid]);
  return r;
}

module.exports = lookupAccountSettingsBySid;
