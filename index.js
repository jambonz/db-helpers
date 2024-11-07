const { Sequelize } = require('sequelize');
const cacheActivator = require('./lib/cache-activator');

const pingDb = async(pool) => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err) return reject(err);
      conn.ping((err) => {
        pool.releaseConnection(conn);
        if (err) return reject(err);
        resolve();
      });
    });
  });
};

module.exports = function(mysqlConfig, logger, writeMysqlConfig = null)  {
  const database = process.env.JAMBONES_DB_DATABASE;
  const username = process.env.JAMBONES_DB_USER;
  const password = process.env.JAMBONES_DB_PASSWORD;
  const host = process.env.JAMBONES_DB_HOST;
  const dialect = process.env.JAMBONES_DB_DIALECT || 'mysql';
  const config = {
    host,
    dialect, /* one of 'mysql' | 'postgres' | 'mariadb' | 'mssql' */
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };

  if( process.env.JAMBONES_DB_CA_CERT && fs.fileExistsSync(process.env.JAMBONES_DB_CA_CERT )){
    config.ssl = {
      ca : fs.readFileSync(process.env.JAMBONES_DB_CA_CERT)
    }
  }


  const pool = new Sequelize(database, username, password, config);

  let writePool = null;
  let writeConfiguration = writeMysqlConfig;
  if (process.env.JAMBONES_DB_WRITE_HOST &&
    process.env.JAMBONES_DB_WRITE_USER &&
    process.env.JAMBONES_DB_WRITE_PASSWORD &&
    process.env.JAMBONES_DB_WRITE_DATABASE) {
    writeConfiguration = {
      dialect: process.env.JAMBONES_DB_WRITE_DIALECT || 'mysql',
      host: process.env.JAMBONES_DB_WRITE_HOST,
      port: process.env.JAMBONES_DB_WRITE_PORT || 3306,
      user: process.env.JAMBONES_DB_WRITE_USER,
      password: process.env.JAMBONES_DB_WRITE_PASSWORD,
      database: process.env.JAMBONES_DB_WRITE_DATABASE,
      connectionLimit: process.env.JAMBONES_DB_WRITE_CONNECTION_LIMIT || 10
    };
  }

  if (writeMysqlConfig) {
    const writeOptions = {
      host: writeConfiguration.host,
      port: writeConfiguration.port,
      dialect: writeConfiguration.dialect, /* one of 'mysql' | 'postgres' | 'mariadb' | 'mssql' */
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    };
    writePool = new Sequelize(writeConfiguration.database,
      writeConfiguration.user, writeConfiguration.password, writeOptions);
    writePool.authenticate().catch((err) => { throw err; });
  }
  // Cache activation for read only.
  if (process.env.JAMBONES_DB_REFRESH_TTL)
    cacheActivator.activate(pool);

  logger = logger || {info: () => {}, error: () => {}, debug: () => {}};

  pool.authenticate().catch((err) => { throw err; });

  return {
    pool,
    ...(writePool && {writePool}),
    ping: pingDb.bind(null, pool),
    lookupAuthHook: require('./lib/lookup-auth-hook').bind(null, pool, logger),
    lookupSipGatewayBySignalingAddress:
      require('./lib/lookup-sip-gateway-by-signaling-address').bind(null, pool, logger),
    lookupAppByPhoneNumber: require('./lib/lookup-app-by-phone-number').bind(null, pool, logger),
    lookupAppByRegex: require('./lib/lookup-app-by-regex').bind(null, pool, logger),
    lookupAppBySid: require('./lib/lookup-app-by-sid').bind(null, pool, logger),
    lookupAppByRealm: require('./lib/lookup-app-by-realm').bind(null, pool, logger),
    lookupAppByTeamsTenant: require('./lib/lookup-app-by-teams-tenant').bind(null, pool, logger),
    lookupAccountBySid: require('./lib/lookup-account-by-sid').bind(null, pool, logger),
    lookupAccountBySipRealm: require('./lib/lookup-account-by-sip-realm').bind(null, pool, logger),
    lookupAccountByPhoneNumber: require('./lib/lookup-account-by-phone-number').bind(null, pool, logger),
    lookupAccountCapacitiesBySid: require('./lib/lookup-account-capacities-by-sid').bind(null, pool, logger),
    addSbcAddress: require('./lib/add-sbc-address').bind(null, writePool ?? pool, logger),
    lookUpSbcAddressesbyIpv4: require('./lib/lookup-sbc-address-by-ipv4').bind(null, pool, logger),
    cleanSbcAddresses: require('./lib/clean-sbc-addresses').bind(null, writePool ?? pool, logger),
    addSmppAddress: require('./lib/add-smpp-address').bind(null, writePool ?? pool, logger),
    lookupAllTeamsFQDNs: require('./lib/lookup-all-teams-fqdns').bind(null, pool, logger),
    lookupTeamsByAccount: require('./lib/lookup-teams-by-account').bind(null, pool, logger),
    lookupAllVoipCarriers: require('./lib/lookup-all-voip-carriers').bind(null, pool, logger),
    lookupCarrierBySid: require('./lib/lookup-carrier-by-sid').bind(null, pool, logger),
    lookupSipGatewaysByFilters: require('./lib/lookup-sip-gateways-by-filters').bind(null, pool, logger),
    lookupSipGatewayBySid: require('./lib/lookup-sip-gateway-by-sid').bind(null, pool, logger),
    lookupSipGatewaysByCarrier: require('./lib/lookup-sip-gateways-by-carrier').bind(null, pool, logger),
    updateSipGatewayBySid: require('./lib/update-sip-gateway-by-sid').bind(null, pool, logger),
    lookupSmppGatewayBySid: require('./lib/lookup-smpp-gateway-by-sid').bind(null, pool, logger),
    lookupSmppGateways: require('./lib/lookup-smpp-gateways').bind(null, pool, logger),
    lookupSmppGatewaysByBindCredentials:
      require('./lib/lookup-smpp-gateways-by-bind-credentials').bind(null, pool, logger),
    queryCallLimits: require('./lib/query-call-limits').bind(null, pool, logger),
    updateVoipCarriersRegisterStatus:
      require('./lib/update-carrier-register-status-by-sid').bind(null, writePool ?? pool, logger),
    lookupCarrierByAccountLcr: require('./lib/lookup-carrier-by-account-lcr').bind(null, pool, logger),
    lookupOutboundCarrierForAccount: require('./lib/lookup-outbound-carrier-for-account').bind(null, pool, logger),
    lookupClientByAccountAndUsername: require('./lib/lookup-client-by-account-username').bind(null, pool, logger),
    lookupSystemInformation: require('./lib/lookup-system-information').bind(null, pool, logger)
  };
};
