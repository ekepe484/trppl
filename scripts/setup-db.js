#!/usr/bin/env node
require('dotenv').config();
const { Client } = require('pg');

async function setup() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) { console.error('❌  DATABASE_URL is not set in .env'); process.exit(1); }
  console.log('🔺  Trppl database setup');
  console.log('   Connecting to:', dbUrl.replace(/:([^:@]+)@/, ':****@'));
  const client = new Client({ connectionString: dbUrl, ssl: false });
  try {
    await client.connect();
    const { rows } = await client.query('SELECT version()');
    console.log('✅  Connected:', rows[0].version.split(' ').slice(0,2).join(' '));
    console.log('\n   Run `npm run dev` to start — migrations run automatically.\n');
  } catch (err) {
    console.error('❌  Connection failed:', err.message);
    console.error('   Check DATABASE_URL in .env and that Postgres is running.\n');
    process.exit(1);
  } finally { await client.end(); }
}
setup();
