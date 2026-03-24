import Database, { type Database as SQLiteDatabase }from 'better-sqlite3'
import * as fs from 'fs'
import path = require('path');

const options = {}
const db = new Database('openclinic.db', options);

db.pragma('journal_mode = WAL');

const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');

db.exec(schema);

export default db as SQLiteDatabase;