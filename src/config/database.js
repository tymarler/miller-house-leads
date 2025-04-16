const neo4j = require('neo4j-driver');
require('dotenv').config();

// Database configuration
const config = {
  uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
  user: process.env.NEO4J_USER || 'neo4j',
  password: process.env.NEO4J_PASSWORD,
  database: process.env.NEO4J_DATABASE || 'MillerHouse',
  maxConnectionPoolSize: 50,
  connectionTimeout: 30000, // 30 seconds
  maxRetryTime: 30000, // 30 seconds
  retryDelay: 1000, // 1 second
  maxRetries: 3
};

// Connection pool
let driver = null;
let isConnected = false;
let connectionError = null;

// Initialize the Neo4j driver
function initializeDriver() {
  try {
    driver = neo4j.driver(
      config.uri,
      neo4j.auth.basic(config.user, config.password),
      {
        encrypted: 'ENCRYPTION_OFF',
        trust: 'TRUST_ALL_CERTIFICATES',
        maxConnectionPoolSize: config.maxConnectionPoolSize,
        connectionTimeout: config.connectionTimeout,
        maxRetryTime: config.maxRetryTime,
        retryDelay: config.retryDelay,
        maxRetries: config.maxRetries
      }
    );
    console.log('Neo4j driver initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Neo4j driver:', error);
    return false;
  }
}

// Test the connection
async function testConnection() {
  if (!driver) {
    console.log('Driver not initialized');
    return false;
  }

  try {
    const session = driver.session();
    await session.run('RETURN 1');
    await session.close();
    isConnected = true;
    console.log('Neo4j connection test successful');
    return true;
  } catch (error) {
    console.error('Neo4j connection test failed:', error);
    isConnected = false;
    return false;
  }
}

// Execute a query with proper session handling
async function executeQuery(queryFn) {
  if (!driver) {
    throw new Error('Neo4j driver not initialized');
  }

  const session = driver.session();
  try {
    const result = await queryFn(session);
    return result;
  } finally {
    await session.close();
  }
}

// Close the driver connection
async function closeDriver() {
  if (driver) {
    try {
      await driver.close();
      console.log('Neo4j driver closed successfully');
    } catch (error) {
      console.error('Error closing Neo4j driver:', error);
    }
  }
}

// Initialize the driver and test the connection
initializeDriver();
testConnection().catch(error => {
  console.error('Failed to test Neo4j connection:', error);
});

module.exports = {
  config,
  driver,
  isConnected,
  connectionError,
  executeQuery,
  closeDriver,
  testConnection
}; 