import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
    user: 'postgres',
    password: 'Alesonic111.',
    host: 'localhost',
    port: 5432,
    database: 'dbFuturo'
});