const debug = require('debug')('jambonz:db-helpers');
const { QueryTypes } = require('sequelize');

const sqlOutboundCarriersByAccount =  `
  SELECT voip_carrier_sid    
  FROM voip_carriers vc
  WHERE account_sid = ?
  AND is_active = 1 
  AND EXISTS (
    SELECT 1 
    FROM sip_gateways sg 
    WHERE sg.voip_carrier_sid = vc.voip_carrier_sid 
    AND sg.is_active = 1
    AND sg.outbound = 1
    )`;

const sqlOutboundCarriersBySP =  `
  SELECT voip_carrier_sid    
  FROM voip_carriers vc
  WHERE service_provider_sid = (SELECT service_provider_sid FROM accounts WHERE account_sid = ?)
  AND account_sid IS NULL
  AND is_active = 1 
  AND EXISTS (
    SELECT 1 
    FROM sip_gateways sg 
    WHERE sg.voip_carrier_sid = vc.voip_carrier_sid 
    AND sg.is_active = 1
    AND sg.outbound = 1
    )`;


/**
 * Look up a random outbound carrier by account sid - this is used when LCR is not enabled
 * @param {*} pool
 * @param {*} logger
 * @param {*} account_sid
 */
async function lookupOutboundCarrierForAccount(pool, logger, account_sid) {
  try {
    const carriers = [];
    const gws = await pool.query(sqlOutboundCarriersByAccount, {
      raw: true,
      replacements: [account_sid],
      type: QueryTypes.SELECT
    });

    console.log('---------------------------------------------');
    console.log(gws);
    console.log('---------------------------------------------');

    carriers.push(...gws);

    console.log('---------------------------------------------');
    console.log(carriers);
    console.log('---------------------------------------------');

    if (carriers.length === 0) {
      const gws = await pool.query(sqlOutboundCarriersBySP, {
        raw: true,
        replacements: [account_sid],
        type: QueryTypes.SELECT
      });
      carriers.push(...gws);
    }
    if (carriers.length === 0) return;
    return carriers[Math.floor(Math.random() * carriers.length)].voip_carrier_sid;
  } catch (err) {
    debug(err);
    logger.error({err}, `Error looking up outbound carrier for account (${account_sid})`);
  }
}

module.exports = lookupOutboundCarrierForAccount;
