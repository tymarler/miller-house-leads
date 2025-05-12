const neo4j = require('neo4j-driver');
require('dotenv').config();

// Database configuration
const config = {
  uri: process.env.NEO4J_URI,
  user: process.env.NEO4J_USER,
  password: process.env.NEO4J_PASSWORD,
  database: process.env.NEO4J_DATABASE,
  options: {
    maxConnectionPoolSize: 50,
    maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
    connectionAcquisitionTimeout: 60 * 1000, // 60 seconds
    connectionTimeout: 30 * 1000, // 30 seconds
    maxTransactionRetryTime: 30 * 1000, // 30 seconds
    encrypted: false // Disable encryption for local development
  }
};

// Initialize the Neo4j driver
function initializeDriver() {
  try {
    const driver = neo4j.driver(
      config.uri,
      neo4j.auth.basic(config.user, config.password),
      config.options
    );
    console.log('Neo4j driver initialized successfully');
    return driver;
  } catch (error) {
    console.error('Failed to initialize Neo4j driver:', error);
    throw error;
  }
}

// Test the connection
async function testConnection(driver) {
  if (!driver) {
    console.log('Driver not initialized');
    return false;
  }

  try {
    const session = driver.session({ database: config.database });
    await session.run('RETURN 1');
    await session.close();
    console.log('Neo4j connection test successful');
    return true;
  } catch (error) {
    console.error('Neo4j connection test failed:', error);
    return false;
  }
}

// Execute a query with proper session handling
async function executeQuery(driver, queryFn) {
  if (!driver) {
    throw new Error('Neo4j driver not initialized');
  }

  const session = driver.session({ database: config.database });
  try {
    const result = await queryFn(session);
    return result;
  } finally {
    await session.close();
  }
}

// Close the driver connection
async function closeDriver(driver) {
  if (driver) {
    try {
      await driver.close();
      console.log('Neo4j driver closed successfully');
    } catch (error) {
      console.error('Error closing Neo4j driver:', error);
    }
  }
}

// Initialize the driver
const driver = initializeDriver();

// Export everything needed
module.exports = {
  driver,
  config,
  dbName: config.database,
  testConnection,
  executeQuery,
  closeDriver
}; 