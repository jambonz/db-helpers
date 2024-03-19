const debug = require('debug')('jambonz:db-helpers');

const sql =
`SELECT *
FROM applications app
LEFT JOIN webhooks AS ch ON app.call_hook_sid = ch.webhook_sid
LEFT JOIN webhooks AS sh ON app.call_status_hook_sid = sh.webhook_sid
LEFT JOIN webhooks AS mh ON app.messaging_hook_sid = mh.webhook_sid
WHERE app.application_sid = (
  SELECT application_sid from phone_numbers where number = ?
)`;

const sqlWithCarrier =
`SELECT *
FROM applications app
LEFT JOIN webhooks AS ch ON app.call_hook_sid = ch.webhook_sid
LEFT JOIN webhooks AS sh ON app.call_status_hook_sid = sh.webhook_sid
LEFT JOIN webhooks AS mh ON app.messaging_hook_sid = mh.webhook_sid
WHERE app.application_sid = (
  SELECT application_sid from phone_numbers where number = ? AND voip_carrier_sid = ?
)`;

const sqlCallRoutes =
`SELECT cr.regex, cr.application_sid
FROM call_routes cr, phone_numbers ph
WHERE ph.number = ?
AND ph.account_sid = cr.account_sid
ORDER BY cr.priority ASC
`;

const sqlCallRoutesWithCarrier =
`SELECT cr.regex, cr.application_sid
FROM call_routes cr, phone_numbers ph
WHERE ph.number = ? 
AND ph.voip_carrier_sid = ? 
AND ph.account_sid = cr.account_sid
ORDER BY cr.priority ASC
`;

/**
 * Lookup the application which should be invoked when a call arrives on a phone number
 * @param {*} pool
 * @param {*} logger
 * @param {*} phoneNumber - phone number that was dialed
 */
async function lookupAppByPhoneNumber(pool, logger, phoneNumber, voip_carrier_sid) {
  const pp = pool.promise();

  /* first see if the phone number is directly assigned to an app */
  const sql1 = voip_carrier_sid ? sqlWithCarrier : sql;
  const args = voip_carrier_sid ? [phoneNumber, voip_carrier_sid] : [phoneNumber];
  const [r] = await pp.execute({sql: sql1, nestTables: true}, args);
  debug(`results from querying phone_numbers for application: ${JSON.stringify(r)}`);
  if (r.length > 0) {
    const obj = r[0].app;
    Object.assign(obj, {call_hook: r[0].ch, call_status_hook: r[0].sh, messaging_hook: r[0].mh});
    if (!obj.call_hook.url) delete obj.call_hook;
    if (!obj.call_status_hook.url) delete obj.call_status_hook;
    if (!obj.messaging_hook.url) delete obj.messaging_hook;
    return obj;
  }
  
  const lookupAppBySid = require('./lookup-app-by-sid').bind(null, pool, logger);
  /* check if this gateway routes all calls to an application */
  if (voip_carrier_sid) {
    const [r2] = await pp.query(
      'SELECT application_sid from voip_carriers where voip_carrier_sid = ?', [voip_carrier_sid]);
    if (r2.length > 0 && r2[0].application_sid) {
      return await lookupAppBySid(r2[0].application_sid);
    }
  }

  // if not, check the regex patterns that have been set up
  // for the account that owns the phone number
  const [callRoutes] = await (voip_carrier_sid ?
    pp.execute(sqlCallRoutesWithCarrier, [phoneNumber, voip_carrier_sid]) :
    pp.execute(sqlCallRoutes, [phoneNumber]));
  const selectedRoute = callRoutes.find((cr) => RegExp(cr.regex).test(phoneNumber));
  if (selectedRoute) return await lookupAppBySid(selectedRoute.application_sid);

  return null;
}

module.exports = lookupAppByPhoneNumber;
