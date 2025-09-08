const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Database connection test
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

// Task operations

// Get all tasks
async function getAllTasks() {
  const query = `
    SELECT id, text, completed, created_at, updated_at
    FROM tasks
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query);
  return result.rows;
}

// Create new task
async function createTask(text) {
  const query = `
    INSERT INTO tasks (text, completed, created_at, updated_at)
    VALUES ($1, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id, text, completed, created_at, updated_at
  `;

  const values = [text];
  const result = await pool.query(query, values);
  return result.rows[0];
}

// Update task
async function updateTask(id, updates) {
  const { text, completed } = updates;

  let query = 'UPDATE tasks SET updated_at = CURRENT_TIMESTAMP';
  const values = [];
  let paramCount = 1;

  if (text !== undefined) {
    query += `, text = $${paramCount}`;
    values.push(text);
    paramCount++;
  }

  if (completed !== undefined) {
    query += `, completed = $${paramCount}`;
    values.push(completed);
    paramCount++;
  }

  query += ` WHERE id = $${paramCount} RETURNING id, text, completed, created_at, updated_at`;
  values.push(id);

  const result = await pool.query(query, values);
  return result.rows[0];
}

// Toggle task completion
async function toggleTaskCompletion(id) {
  const query = `
    UPDATE tasks 
    SET completed = NOT completed, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, text, completed, created_at, updated_at
  `;

  const values = [id];
  const result = await pool.query(query, values);
  return result.rows[0];
}

// Delete task
async function deleteTask(id) {
  const query = 'DELETE FROM tasks WHERE id = $1 RETURNING id';
  const values = [id];
  const result = await pool.query(query, values);
  return result.rows[0];
}

// Get task by ID
async function getTaskById(id) {
  const query = `
    SELECT id, text, completed, created_at, updated_at
    FROM tasks
    WHERE id = $1
  `;

  const values = [id];
  const result = await pool.query(query, values);
  return result.rows[0];
}

// Close pool connection
async function closePool() {
  await pool.end();
}

module.exports = {
  getAllTasks,
  createTask,
  updateTask,
  toggleTaskCompletion,
  deleteTask,
  getTaskById,
  closePool
};