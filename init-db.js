const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: 'postgres', // Connect to default database first
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function initializeDatabase() {
  const client = await pool.connect();

  try {
    // Create database if it doesn't exist
    await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
    console.log(`Database ${process.env.DB_NAME} created successfully!`);
  } catch (error) {
    if (error.code === '42P04') {
      console.log(`Database ${process.env.DB_NAME} already exists.`);
    } else {
      console.error('Error creating database:', error);
    }
  } finally {
    client.release();
  }

  // Connect to the todo database
  const todoPool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  const todoClient = await todoPool.connect();

  try {
    // Create tasks table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        text VARCHAR(255) NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await todoClient.query(createTableQuery);
    console.log('Tasks table created successfully!');

    // Insert sample data
    const sampleDataQuery = `
      INSERT INTO tasks (text, completed, created_at) VALUES
      ('Complete project documentation', FALSE, CURRENT_TIMESTAMP),
      ('Review code changes', TRUE, CURRENT_TIMESTAMP),
      ('Setup database connection', FALSE, CURRENT_TIMESTAMP),
      ('Write unit tests', FALSE, CURRENT_TIMESTAMP)
      ON CONFLICT DO NOTHING;
    `;

    await todoClient.query(sampleDataQuery);
    console.log('Sample data inserted successfully!');

  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    todoClient.release();
    await todoPool.end();
  }

  await pool.end();
}

initializeDatabase();