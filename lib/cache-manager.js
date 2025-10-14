const cache = {};
let timerID = null;

function startUpdater() {
  // debug('cache: maybe update', { timerID, envVar: process.env.JAMBONES_MYSQL_REFRESH_TTL });

  if (timerID === null) {
    const ttl = parseInt(process.env.JAMBONES_MYSQL_REFRESH_TTL || '0.001', 10) * 1000;

    timerID = setTimeout(function() {
      const now = new Date();
      const promises = Object.keys(cache).reduce(function(arr, sha1) {
        const item = cache[sha1];
        const delta = now - item.timestamp;

        if (delta >= ttl) {
          delete cache[sha1];
        }

        return arr;
      }, []);

      Promise.all(promises).then(function() {
        timerID = null;
        const keys = Object.keys(cache);
        if (keys.length > 0)
          startUpdater();
        return;
      }).catch(function(err) {
      });
    }, ttl);
  }
}

module.exports = {
  cache,
  startUpdater
};
