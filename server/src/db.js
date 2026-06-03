import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

let sequelize;
const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl) {
  const isCloudDb = databaseUrl.includes('aivencloud.com') || databaseUrl.includes('ssl-mode=REQUIRED');
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'mysql',
    logging: false,
    dialectOptions: isCloudDb ? {
      ssl: {
        rejectUnauthorized: false
      }
    } : {}
  });
} else {
  // Support individual DB credentials
  const host = process.env.DB_HOST?.trim() || 'localhost';
  const port = process.env.DB_PORT?.trim() || '3306';
  const user = process.env.DB_USER?.trim();
  const password = process.env.DB_PASSWORD?.trim();
  const database = process.env.DB_NAME?.trim() || 'defaultdb';

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
    } : {}
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
