const test = require('tape').test ;
const exec = require('child_process').exec ;
const dialect = process.env.JAMBONES_DB_DIALECT  || 'mysql';
const compose_file = dialect === 'mysql' ? 'docker-compose-testbed.yaml' : 'docker-compose-postgres.yaml';

test('starting docker network..', (t) => {
  exec(`docker compose -f ${__dirname}/${compose_file} up -d`, (err, stdout, stderr) => {
    setTimeout(() => {
      t.end(err);
    }, 15000);
  });
});

  
