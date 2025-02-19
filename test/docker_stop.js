const test = require('tape').test;
const exec = require('child_process').exec;
const dialect = process.env.JAMBONES_DB_DIALECT  || 'mysql';
const compose_file = dialect === 'mysql' ? 'docker-compose-testbed.yaml' : 'docker-compose-postgres.yaml';

test('stopping docker network..', (t) => {
  t.timeoutAfter(10000);
  exec(`docker compose -f ${__dirname}/${compose_file} down`, (err, stdout, stderr) => {
    //console.log(`stderr: ${stderr}`);
    process.exit(0);
  });
  t.end();
});

