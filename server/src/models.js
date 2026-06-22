import { DataTypes } from 'sequelize';
import sequelize from './db.js';

// User Schema Model
export const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user' // 'user' or 'admin'
  }
});

// Device Schema Model
export const Device = sequelize.define('Device', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  userEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Offline'
  },
  ppm: {
    type: DataTypes.STRING,
    defaultValue: '0'
  },
  lastActive: {
    type: DataTypes.STRING,
    defaultValue: 'Belum Aktif'
  }
});
