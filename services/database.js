import * as SQLite from 'expo-sqlite';

let dbInstance = null; // Singleton instance to prevent multiple connections

export const initDB = async () => {
  // If the DB is already initialized, return the existing connection instantly
  if (dbInstance) return dbInstance;

  try {
    dbInstance = await SQLite.openDatabaseAsync('wallet.db');
    
    await dbInstance.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS Accounts (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        balance REAL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS Transactions (
        id TEXT PRIMARY KEY NOT NULL,
        accountId TEXT NOT NULL,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT,
        date TEXT NOT NULL,
        isBankTransaction INTEGER DEFAULT 0,
        rawBankData TEXT,
        FOREIGN KEY (accountId) REFERENCES Accounts (id)
      );

      CREATE TABLE IF NOT EXISTS Limits (
        id TEXT PRIMARY KEY NOT NULL,
        accountId TEXT NOT NULL,
        limitAmount REAL NOT NULL,
        timeframeType TEXT NOT NULL,
        timeframeValue INTEGER NOT NULL,
        thresholdPercentage REAL NOT NULL
      );
    `);

    // Safely inject columns (Errors ignored if they already exist)
    try { await dbInstance.execAsync("ALTER TABLE Transactions ADD COLUMN type TEXT DEFAULT 'EXPENSE';"); } catch (e) {}
    try { await dbInstance.execAsync("ALTER TABLE Transactions ADD COLUMN linkedTransactionId TEXT;"); } catch (e) {}

    console.log("✅ SQLite Database initialized successfully!");
    return dbInstance;
  } catch (error) {
    console.error("❌ Error initializing SQLite database:", error);
    dbInstance = null;
    throw error;
  }
};

export const getDB = async () => {
  if (!dbInstance) {
    return await initDB();
  }
  return dbInstance;
};