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
  const pp = pool.promise();
  try {
    const carriers = [];
    const [gws] = await pp.query(sqlOutboundCarriersByAccount, [account_sid]);
    carriers.push(...gws);
    if (carriers.length === 0) {
      const [gws] = await pp.query(sqlOutboundCarriersBySP, [account_sid]);
      carriers.push(...gws);
    }
    if (carriers.length === 0) return;
    return carriers[Math.floor(Math.random() * carriers.length)].voip_carrier_sid;
  } catch (err) {
    logger.error({err}, `Error looking up outbound carrier for account (${account_sid})`);
  }
}

module.exports = lookupOutboundCarrierForAccount;
