import { Pool } from 'pg';

const pool = new Pool({
    host: "localhost",
    password: "admin123",
    user: "postgres",
    database: "fragmint_db"
});

export default pool;