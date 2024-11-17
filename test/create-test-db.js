const test = require('tape').test ;
const exec = require('child_process').exec ;
const dialect = process.env.JAMBONES_DB_DIALECT  || 'mysql';

if(dialect == 'mysql') {

test('creating jambones_test database', (t) => {
  exec(`mysql -h 127.0.0.1 -u root --protocol=tcp < ${__dirname}/db/create_test_db.sql`, (err, stdout, stderr) => {
    if (err) return t.end(err);
    t.pass('database successfully created');
    t.end();
  });
});

test('creating schema', (t) => {
  exec(`mysql -h 127.0.0.1 -u root --protocol=tcp -D jambones_test < ${__dirname}/db/jambones-sql.sql`, (err, stdout, stderr) => {
    if (err) return t.end(err);
    t.pass('schema successfully created');
    t.end();
  });
});

test('populating test database', (t) => {
  exec(`mysql -h 127.0.0.1 -u root --protocol=tcp -D jambones_test < ${__dirname}/db/populate-test-data.sql`, (err, stdout, stderr) => {
    if (err) return t.end(err);
    t.pass('create test data');
    t.end();
  });
});

}else{
  test('creating jambones_test database', (t) => {
    exec(`PGPASSWORD=jambones_test psql -h 127.0.0.1 -U postgres -f ${__dirname}/db/create_test_db.sql`, (err, stdout, stderr) => {
      if (err) return t.end(err);
      t.pass('database successfully created');
      t.end();
    });
  });
  
  test('creating schema', (t) => {
    exec(`PGPASSWORD=jambones_test psql -h 127.0.0.1 -U postgres -d jambones_test -f ${__dirname}/db/postgres/jambones-sql.sql`, (err, stdout, stderr) => {
      if (err) return t.end(err);
      t.pass('schema successfully created');
      t.end();
    });
  });
  
  test('populating test database', (t) => {
    exec(`PGPASSWORD=jambones_test psql -h 127.0.0.1 -U postgres -d jambones_test -f ${__dirname}/db/postgres/populate-test-data.sql`, (err, stdout, stderr) => {
      if (err) return t.end(err);
      t.pass('create test data');
      t.end();
    });
  });
}
