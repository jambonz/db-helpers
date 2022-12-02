//const debug = require('debug')('jambonz:db-helpers');
const assert = require('assert');

const sqlGatewaysByAccount =
`SELECT sg.voip_carrier_sid, sg.sip_gateway_sid, sg.ipv4, sg.port, vc.name, vc.e164_leading_plus,
vc.requires_register, vc.register_username, vc.register_sip_realm, 
vc.register_password, vc.tech_prefix, vc.diversion, vc.account_sid, vc.service_provider_sid    
FROM sip_gateways sg, voip_carriers vc
WHERE sg.is_active = 1
AND sg.voip_carrier_sid = vc.voip_carrier_sid
AND vc.is_active = 1 
AND vc.account_sid = ? 
AND sg.outbound = 1`;

const sqlGatewaysBySp =
`SELECT sg.voip_carrier_sid, sg.sip_gateway_sid, sg.ipv4, sg.port, vc.name, vc.e164_leading_plus,
vc.requires_register, vc.register_username, vc.register_sip_realm, 
vc.register_password, vc.tech_prefix, vc.diversion, vc.account_sid, vc.service_provider_sid    
FROM sip_gateways sg, voip_carriers vc
WHERE sg.is_active = 1
AND sg.voip_carrier_sid = vc.voip_carrier_sid
AND vc.is_active = 1
AND vc.account_sid IS NULL 
AND vc.service_provider_sid = (SELECT service_provider_sid FROM accounts WHERE account_sid = ?)  
AND sg.outbound = 1`;

const sqlRegexByAccount = `
SELECT regex, lcr_route_sid 
FROM lcr_routes 
WHERE lcr_route_sid IN (
  SELECT lcr_route_sid
  FROM lcr_carrier_set_entry lcse, voip_carriers vc 
  WHERE lcse.voip_carrier_sid = vc.voip_carrier_sid 
  AND vc.account_sid = ?
)
ORDER BY priority ASC`;

const sqlRegexBySp = `
SELECT regex, lcr_route_sid 
FROM lcr_routes 
WHERE lcr_route_sid IN (
  SELECT lcr_route_sid
  FROM lcr_carrier_set_entry lcse, voip_carriers vc 
  WHERE lcse.voip_carrier_sid = vc.voip_carrier_sid 
  AND vc.service_provider_sid = ?
)
ORDER BY priority ASC`;

const sqlCarrierSetByAccount =
`SELECT lcs.voip_carrier_sid, vc.name, priority, workload 
FROM lcr_carrier_set_entry lcs, voip_carriers vc
WHERE lcs.lcr_route_sid = ?
AND lcs.voip_carrier_sid = vc.voip_carrier_sid
AND vc.account_sid = ?
AND vc.is_active = 1 
ORDER by priority ASC`;

const sqlCarrierSetBySp =
`SELECT lcs.voip_carrier_sid, vc.name, priority, workload 
FROM lcr_carrier_set_entry lcs, voip_carriers vc
WHERE lcs.lcr_route_sid = ?
AND lcs.voip_carrier_sid = vc.voip_carrier_sid
AND vc.service_provider_sid = ?
AND vc.is_active = 1 
ORDER by priority ASC`;

const sqlGateways =
`SELECT sg.voip_carrier_sid, sg.sip_gateway_sid, sg.ipv4, sg.port, vc.name, vc.e164_leading_plus, 
vc.requires_register, vc.register_username, vc.register_sip_realm, 
vc.register_password, vc.tech_prefix, vc.diversion, vc.account_sid, vc.service_provider_sid   
FROM sip_gateways sg, voip_carriers vc
WHERE sg.is_active = 1
AND vc.is_active = 1 
AND outbound = 1
AND sg.voip_carrier_sid = vc.voip_carrier_sid
AND sg.voip_carrier_sid IN (?)`;

const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const gatewayMapper = (calledNumber, o) => {
  const prefix = o.tech_prefix;
  const hostport = (!o.port || 5060 === o.port) ? o.ipv4 : `${o.ipv4}:${o.port}`;
  const prependPlus = o.e164_leading_plus && !calledNumber.startsWith('0');
  return {
    hostport,
    uri: `sip:${prefix ? prefix : ''}${prependPlus ? '+' : ''}${calledNumber}@${hostport}`,
    name: o.name,
    diversion: o.diversion,
    auth: o.register_username && o.register_password ?
      {
        username: o.register_username,
        password: o.register_password
      } : null
  };
};

const countUniqueCarriers = (gws) => {
  const arr = gws.map((gw) => gw.voip_carrier_sid);
  return new Set(arr).size;
};


async function performLcr(pool, logger, calledNumber, account_sid) {
  let countOfAccountLevelCarriers = 0;
  let countOfServiceProviderLevelCarriers = 0;
  let service_provider_sid;
  let gateways;

  const pp = pool.promise();
  const [vcsByAcc] = await pp.query(sqlGatewaysByAccount, account_sid);
  if (vcsByAcc.length > 0) {
    countOfAccountLevelCarriers = countUniqueCarriers(vcsByAcc);
    gateways = vcsByAcc;
    //debug({account_sid}, `performLcr: ${countOfAccountLevelCarriers} account-level carriers`);
    logger.debug({account_sid}, `performLcr: ${countOfAccountLevelCarriers} account-level carriers`);
  }
  else {
    const [vcsBySp] = await pp.query(sqlGatewaysBySp, account_sid);
    if (vcsBySp.length > 0) {
      countOfServiceProviderLevelCarriers = countUniqueCarriers(vcsBySp);
      gateways = vcsBySp;
      service_provider_sid = vcsBySp[0].service_provider_sid;
      //debug({account_sid}, `performLcr: ${countOfServiceProviderLevelCarriers} sp-level carriers`);
      logger.debug({account_sid}, `performLcr: ${countOfServiceProviderLevelCarriers} sp-level carriers`);
    }
  }

  /* no carriers provisioned */
  if (0 === countOfAccountLevelCarriers + countOfServiceProviderLevelCarriers) {
    //debug({account_sid}, 'performLcr: no carriers provisioned at either account or service provider');
    logger.debug({account_sid}, 'performLcr: no carriers provisioned at either account or service provider');
    return;
  }

  /* multiple outbound carriers - check for regex-based routing rules */
  const [r] = countOfAccountLevelCarriers > 0 ?
    await pp.execute(sqlRegexByAccount, [account_sid]) :
    await pp.execute(sqlRegexBySp, [service_provider_sid]);
  //debug(`matching regex'es: ${JSON.stringify(r)}`);
  if (r.length > 0) {
    /* we have regex rules,  search for a matching regex */
    const lcr_route = r.find((lcr) => RegExp(lcr.regex).test(calledNumber));
    //debug(`matching lcr_route: ${lcr_route} for ${calledNumber}`);
    if (!lcr_route) throw new Error('no matching lcr route');

    /* retrieve the carriers configured for that route */
    //debug(`lcr_route_sid: ${lcr_route.lcr_route_sid}`);
    const [carriers] = countOfAccountLevelCarriers > 0 ?
      await pp.execute(sqlCarrierSetByAccount, [lcr_route.lcr_route_sid, account_sid]) :
      await pp.execute(sqlCarrierSetBySp, [lcr_route.lcr_route_sid, service_provider_sid]);

    const vcsids = carriers.map((o) => o.voip_carrier_sid);
    //debug(`matching vcsids: ${JSON.stringify(vcsids)}`);
    if (vcsids.length === 0) throw new Error('no configured gateways for lcr route');
    //debug(`performLcr: voip_carrier_sids: ${JSON.stringify(vcsids)}`);

    /* create a Map of carrier => [{name, uri, auth}] outbound gateways */
    const [r2] = await pp.query(sqlGateways, [vcsids]);
    const gwMap = new Map();
    r2.forEach((o) => {
      const vc_sid = o.voip_carrier_sid;
      const prefix = o.tech_prefix;
      const hostport = !o.port || 5060 === o.port ? o.ipv4 : `${o.ipv4}:${o.port}`;
      const prependPlus = o.e164_leading_plus && !calledNumber.startsWith('0');
      const obj = {
        uri: `sip:${prefix ? prefix : ''}${prependPlus ? '+' : ''}${calledNumber}@${hostport}`,
        hostport,
        name: o.name,
        diversion: o.diversion,
        auth: o.register_username && o.register_password ?
          {
            username: o.register_username,
            password: o.register_password
          } : null
      };
      if (!gwMap.has(vc_sid)) gwMap.set(vc_sid, []);
      gwMap.get(vc_sid).push(obj);
    });

    /*
      1. add gateways into each carrier row
      2. stratify into layers by priority
      3. reduce each layer into an ordered list of gateways, as a function of workload/distribution
      4. reduce all the layers into a final ordered list of gateways
    */
    const fnGatewayInsert = addGateways.bind(null, gwMap);
    const gateways = stratifyByPriority(carriers.map(fnGatewayInsert))
      .map(orderGatewaysByWorkload)
      .reduce(appendGateways, []);

    logger.debug({gateways}, `performLcr: regex-based final list of gateways for ${calledNumber}`);
    //debug({gateways}, `performLcr: regex-based final list of gateways for ${calledNumber}`);
    return gateways;
  }

  /* no regex-based routing rules: go with random selection */
  return shuffle(gateways.map(gatewayMapper.bind(null, calledNumber)));
}

function addGateways(gwMap, obj) {
  obj.gateways = gwMap.get(obj.voip_carrier_sid);
  return obj;
}

function stratifyByPriority(carriers) {
  const layers = [];
  let priority = null;
  let start = 0;
  //debug(`stratifyByPriority: input ${JSON.stringify(carriers)}`);
  carriers.forEach((c, idx) => {
    if (idx === 0) priority = c.priority;
    if (priority != c.priority) {
      layers.push(carriers.slice(start, idx));
      start = idx;
      priority = c.priority;
    }
  });
  layers.push(carriers.slice(start));
  //debug(`stratifyByPriority: output ${JSON.stringify(layers)}`);
  return layers;
}

function orderGatewaysByWorkload(layer) {
  //debug(`orderGatewaysByWorkload: input ${JSON.stringify(layer)}`);
  const total = layer.reduce((accum, c) => accum + c.workload, 0);

  // select one randomly based on desired workload
  const random = Math.random() * total;
  let mark = 0, selected = -1;
  const gateways = [];
  for (let i = 0; i < layer.length; i++) {
    if (selected === -1 && random <= (mark += layer[i].workload)) selected = i;
    else {
      gateways.push(layer[i].gateways);
    }
  }
  assert(selected >= 0);

  // put selected one at the front
  const result = [].concat(layer[selected].gateways, ...gateways);
  //debug(`orderGatewaysByWorkload: output ${JSON.stringify(result)}`);
  return result;
}

function appendGateways(accum, arrGateways) {
  return accum.concat(arrGateways);
}


module.exports = performLcr;
