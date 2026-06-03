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
  const isCloudDb = databaseUrl.includes('aivencloud.com') || databaseUrl.includes('ssl-mode=REQUIRED');
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'mysql',
    logging: false,
    dialectOptions: isCloudDb ? {
      ssl: {
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

  const isCloudDb = host.includes('aivencloud.com');

  sequelize = new Sequelize(database, user, password, {
    host,
    port: parseInt(port),
    dialect: 'mysql',
    logging: false,
    dialectOptions: isCloudDb ? {
      ssl: {
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
