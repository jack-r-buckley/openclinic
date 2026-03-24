import Database from 'better-sqlite3';
import * as fs from 'fs';
import path from 'path';

/**
 * Create an isolated test database with schema
 * Each test suite gets its own in-memory or temp database
 */
export function createTestDb(): Database.Database {
  const db = new Database(':memory:');
  
  db.pragma('journal_mode = WAL');
  
  // Load and execute schema
  const schemaPath = path.join(__dirname, '../db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  
  db.exec(schema);
  
  return db;
}

/**
 * Clear all tables in a database
 */
export function clearTestDb(db: Database.Database): void {
  db.prepare('DELETE FROM appointment').run();
  db.prepare('DELETE FROM patient').run();
  db.prepare('DELETE FROM clinician').run();
}
