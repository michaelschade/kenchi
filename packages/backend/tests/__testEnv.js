const { Client } = require('pg');
const NodeEnvironment = require('jest-environment-node');
const path = require('path');
const dotenv = require('dotenv');
const process = require('process');
const cryptoRandomString = require('crypto-random-string');

dotenv.config({ path: path.resolve(process.cwd(), '.env.ci') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

class PrismaTestEnvironment extends NodeEnvironment {
  constructor(config) {
    super(config);
    // Generate a unique schema identifier for this test context
    this.dbName = `test_${cryptoRandomString({
      length: 16,
      type: 'alphanumeric',
    })}`;
    const dbUrl = new URL(process.env.DATABASE_URL);
    dbUrl.pathname = '';
    this.connectionStringWithoutDatabase = dbUrl.toString();
    this.connectionString = `${this.connectionStringWithoutDatabase}/${this.dbName}`;
  }

  async setup() {
    // DB doesn't exist yet so connect to original URL
    const client = new Client({
      connectionString: this.connectionStringWithoutDatabase,
    });
    await client.connect();
    await client.query(
      `CREATE DATABASE "${this.dbName}" TEMPLATE "test_template"`
    );
    await client.end();

    // Set the required environment variable to contain the connection string
    // to our database test schema
    process.env.DATABASE_URL = this.connectionString;
    this.global.process.env.DATABASE_URL = this.connectionString;

    return super.setup();
  }

  async teardown() {
    await super.teardown();

    // Drop the DB after the tests have completed
    const client = new Client({
      connectionString: this.connectionStringWithoutDatabase,
    });

    await client.connect();
    try {
      await client.query(`DROP DATABASE IF EXISTS "${this.dbName}"`);
    } catch (e) {
      // TODO: sometimes we get "error: cannot drop the currently open
      // database", unsure why. Ignore for now...
    }
    await client.end();
  }
}

module.exports = PrismaTestEnvironment;
