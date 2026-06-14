import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Helper to strip surrounding quotes and spaces from env variables
const cleanEnv = (val) => {
  if (!val) return '';
  let str = val.trim();
  if (str.startsWith('"') && str.endsWith('"')) {
    str = str.substring(1, str.length - 1);
  }
  if (str.startsWith("'") && str.endsWith("'")) {
    str = str.substring(1, str.length - 1);
  }
  return str.trim();
};

let sequelize;
const databaseUrl = cleanEnv(process.env.DATABASE_URL);

if (databaseUrl) {
  const isCloudDb = databaseUrl.includes('aivencloud.com') || databaseUrl.includes('ssl-mode=REQUIRED') || databaseUrl.includes('supabase.co') || databaseUrl.includes('pooler.supabase.com') || databaseUrl.startsWith('postgres') || databaseUrl.startsWith('postgresql');
  const dialect = (databaseUrl.startsWith('postgres') || databaseUrl.startsWith('postgresql') || databaseUrl.includes('supabase.co') || databaseUrl.includes('pooler.supabase.com')) ? 'postgres' : 'mysql';
  
  // Clean URL to prevent sslmode query parameter from overriding dialectOptions.ssl
  let cleanUrl = databaseUrl;
  if (cleanUrl.includes('?')) {
    cleanUrl = cleanUrl.replace(/[\?&]sslmode=[^&]+/g, '').replace(/[\?&]ssl-mode=[^&]+/g, '');
    if (cleanUrl.endsWith('?') || cleanUrl.endsWith('&')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
  }

  console.log('--- DB SETUP DEBUG ---');
  console.log('process.env.DATABASE_URL:', process.env.DATABASE_URL);
  console.log('cleanUrl:', cleanUrl);
  console.log('isCloudDb:', isCloudDb);
  console.log('dialect:', dialect);
  console.log('----------------------');

  sequelize = new Sequelize(cleanUrl, {
    dialect: dialect,
    logging: false,
    dialectOptions: isCloudDb ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {},
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // Support individual DB credentials
  const host = cleanEnv(process.env.DB_HOST) || 'localhost';
  const port = cleanEnv(process.env.DB_PORT) || '3306';
  const user = cleanEnv(process.env.DB_USER);
  const password = cleanEnv(process.env.DB_PASSWORD);
  const database = cleanEnv(process.env.DB_NAME) || 'defaultdb';

  if (!user) {
    console.error('Neither DATABASE_URL nor DB_USER is defined in environment variables!');
    process.exit(1);
  }

  const isCloudDb = host.includes('aivencloud.com') || host.includes('supabase.co') || host.includes('pooler.supabase.com');
  const dialect = (port === '5432' || host.includes('supabase.co') || host.includes('pooler.supabase.com')) ? 'postgres' : 'mysql';

  sequelize = new Sequelize(database, user, password, {
    host,
    port: parseInt(port),
    dialect,
    logging: false,
    dialectOptions: isCloudDb ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {},
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
}

export const initDb = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to MySQL database successfully.');
    
    // Auto-migrate: automatically synchronizes DB tables with model definitions.
    // Creates tables if they don't exist and alters columns if they changed.
    await sequelize.sync({ alter: true });
    console.log('Database synchronized (auto-migrated).');
  } catch (error) {
    console.error('Database connection or synchronization failed:', error);
    throw error;
  }
};

export default sequelize;
