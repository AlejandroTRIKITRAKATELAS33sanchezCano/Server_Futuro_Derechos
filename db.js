import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
    user: 'postgres',
    password: 'Alesonic111.',
    host: 'db.aqirbybomcgoxhefftnx.supabase.co',
    port: 5432,
    database: 'postgres'
});