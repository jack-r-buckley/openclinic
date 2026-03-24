import Database, { type Database as SQLiteDatabase }from 'better-sqlite3'
import * as fs from 'fs'
import path from 'path';

const options = {}

// Use in-memory database for tests, file-based for production
const dbPath = process.env.NODE_ENV === 'test' ? ':memory:' : 'openclinic.db';
const db = new Database(dbPath, options);

db.pragma('journal_mode = WAL');

const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');

db.exec(schema);

export default db as SQLiteDatabase;