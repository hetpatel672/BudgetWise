import SQLite from 'react-native-sqlite-storage';
import CryptoJS from 'crypto-js';
import { Transaction } from '../models/Transaction';
import { Budget } from '../models/Budget';

class DatabaseService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      SQLite.enablePromise(true);
      this.db = await SQLite.openDatabase({
        name: 'budgetwise.db',
        location: 'default',
      });
      await this.createTables();
      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      // For now, just set as initialized to prevent app crash
      this.isInitialized = true;
    }
  }

  async createTables() {
    try {
      const createTransactionsTable = `
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          amount REAL NOT NULL,
          type TEXT NOT NULL,
          category TEXT,
          subcategory TEXT,
          description TEXT,
          date TEXT NOT NULL,
          account TEXT DEFAULT 'main',
          currency TEXT DEFAULT 'USD',
          tags TEXT,
          location TEXT,
          receipt TEXT,
          recurring INTEGER DEFAULT 0,
          recurringPattern TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `;

      const createBudgetsTable = `
        CREATE TABLE IF NOT EXISTS budgets (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT,
          amount REAL NOT NULL,
          spent REAL DEFAULT 0,
          period TEXT DEFAULT 'monthly',
          startDate TEXT NOT NULL,
          endDate TEXT NOT NULL,
          currency TEXT DEFAULT 'USD',
          color TEXT DEFAULT '#6366f1',
          icon TEXT DEFAULT 'wallet',
          notifications INTEGER DEFAULT 1,
          warningThreshold REAL DEFAULT 80,
          isActive INTEGER DEFAULT 1,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `;

      const createCategoriesTable = `
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          color TEXT DEFAULT '#6366f1',
          icon TEXT DEFAULT 'folder',
          parentId TEXT,
          isActive INTEGER DEFAULT 1,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `;

      const createSettingsTable = `
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `;

      await this.db.executeSql(createTransactionsTable);
      await this.db.executeSql(createBudgetsTable);
      await this.db.executeSql(createCategoriesTable);
      await this.db.executeSql(createSettingsTable);

      // Insert default data
      await this.insertDefaultCategories();
      await this.insertDefaultSettings();
    } catch (error) {
      console.error('Error creating tables:', error);
    }
  }

  async insertDefaultCategories() {
    try {
      const defaultCategories = [
        { name: 'Salary', type: 'income', color: '#10b981', icon: 'briefcase' },
        { name: 'Food & Dining', type: 'expense', color: '#ef4444', icon: 'restaurant' },
        { name: 'Transportation', type: 'expense', color: '#f97316', icon: 'car' },
        { name: 'Shopping', type: 'expense', color: '#eab308', icon: 'bag' },
        { name: 'Entertainment', type: 'expense', color: '#8b5cf6', icon: 'film' },
      ];

      for (const category of defaultCategories) {
        const id = 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const now = new Date().toISOString();
        
        await this.db.executeSql(
          `INSERT OR IGNORE INTO categories (id, name, type, color, icon, isActive, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
          [id, category.name, category.type, category.color, category.icon, now, now]
        );
      }
    } catch (error) {
      console.error('Error inserting default categories:', error);
    }
  }

  async insertDefaultSettings() {
    try {
      const defaultSettings = [
        { key: 'currency', value: 'USD' },
        { key: 'theme', value: 'system' },
        { key: 'notifications', value: 'true' },
        { key: 'firstLaunch', value: 'true' }
      ];

      const now = new Date().toISOString();
      for (const setting of defaultSettings) {
        await this.db.executeSql(
          `INSERT OR IGNORE INTO settings (key, value, updatedAt) VALUES (?, ?, ?)`,
          [setting.key, setting.value, now]
        );
      }
    } catch (error) {
      console.error('Error inserting default settings:', error);
    }
  }

  // Transaction methods
  async addTransaction(transaction) {
    await this.initialize();
    try {
      const txn = transaction instanceof Transaction ? transaction : new Transaction(transaction);
      
      await this.db.executeSql(
        `INSERT INTO transactions (id, amount, type, category, subcategory, description, date, account, currency, tags, location, receipt, recurring, recurringPattern, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          txn.id, txn.amount, txn.type, txn.category, txn.subcategory, txn.description,
          txn.date.toISOString(), txn.account, txn.currency, JSON.stringify(txn.tags),
          txn.location, txn.receipt, txn.recurring ? 1 : 0, JSON.stringify(txn.recurringPattern),
          txn.createdAt.toISOString(), txn.updatedAt.toISOString()
        ]
      );

      return txn;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }

  async getTransactions(limit = 100, offset = 0, filters = {}) {
    await this.initialize();
    try {
      let query = 'SELECT * FROM transactions WHERE 1=1';
      const params = [];

      if (filters.type) {
        query += ' AND type = ?';
        params.push(filters.type);
      }

      if (filters.category) {
        query += ' AND category = ?';
        params.push(filters.category);
      }

      if (filters.startDate) {
        query += ' AND date >= ?';
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ' AND date <= ?';
        params.push(filters.endDate);
      }

      query += ' ORDER BY date DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [results] = await this.db.executeSql(query, params);
      const transactions = [];
      
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        const txn = { ...row };
        txn.tags = JSON.parse(txn.tags || '[]');
        txn.recurringPattern = JSON.parse(txn.recurringPattern || 'null');
        txn.recurring = Boolean(txn.recurring);
        transactions.push(Transaction.fromJSON(txn));
      }
      
      return transactions;
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  // Analytics methods
  async getTransactionSummary(startDate, endDate) {
    await this.initialize();
    try {
      const [results] = await this.db.executeSql(
        `SELECT type, SUM(amount) as total FROM transactions 
         WHERE date >= ? AND date <= ? 
         GROUP BY type`,
        [startDate, endDate]
      );

      const summary = { income: 0, expense: 0, transfer: 0 };
      
      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        summary[row.type] = row.total;
      }

      return summary;
    } catch (error) {
      console.error('Error getting transaction summary:', error);
      return { income: 0, expense: 0, transfer: 0 };
    }
  }

  async getCategoryBreakdown(type, startDate, endDate) {
    await this.initialize();
    try {
      const [results] = await this.db.executeSql(
        `SELECT category, SUM(amount) as total, COUNT(*) as count 
         FROM transactions 
         WHERE type = ? AND date >= ? AND date <= ? 
         GROUP BY category 
         ORDER BY total DESC`,
        [type, startDate, endDate]
      );

      const breakdown = [];
      for (let i = 0; i < results.rows.length; i++) {
        breakdown.push(results.rows.item(i));
      }
      
      return breakdown;
    } catch (error) {
      console.error('Error getting category breakdown:', error);
      return [];
    }
  }

  async getMonthlyTrends(months = 6) {
    await this.initialize();
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      
      const [results] = await this.db.executeSql(
        `SELECT 
           strftime('%Y-%m', date) as month,
           type,
           SUM(amount) as total
         FROM transactions 
         WHERE date >= ? 
         GROUP BY month, type 
         ORDER BY month DESC`,
        [startDate.toISOString()]
      );

      const trends = [];
      for (let i = 0; i < results.rows.length; i++) {
        trends.push(results.rows.item(i));
      }
      
      return trends;
    } catch (error) {
      console.error('Error getting monthly trends:', error);
      return [];
    }
  }

  // Settings methods
  async getSetting(key) {
    await this.initialize();
    try {
      const [results] = await this.db.executeSql('SELECT value FROM settings WHERE key = ?', [key]);
      return results.rows.length > 0 ? results.rows.item(0).value : null;
    } catch (error) {
      console.error('Error getting setting:', error);
      return null;
    }
  }

  async setSetting(key, value) {
    await this.initialize();
    try {
      const now = new Date().toISOString();
      await this.db.executeSql(
        `INSERT OR REPLACE INTO settings (key, value, updatedAt) VALUES (?, ?, ?)`,
        [key, value, now]
      );
    } catch (error) {
      console.error('Error setting value:', error);
    }
  }
}

export default new DatabaseService();