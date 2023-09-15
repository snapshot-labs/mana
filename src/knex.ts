import knex from 'knex';

export default knex({
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL
  }
});
