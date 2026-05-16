import 'dotenv/config';    
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.NEONDB_CONNECTION_STRING,
});

export default pool;