const neo4j = require('neo4j-driver');
const { driver, config, testConnection } = require('./src/config/database');

async function testNeo4jConnection() {
  try {
    const connected = await testConnection(driver);
    if (connected) {
      console.log('Successfully connected to Neo4j database');
      console.log('Database configuration:', {
        uri: config.uri,
        user: config.user,
        database: config.database
      });
    } else {
      console.error('Failed to connect to Neo4j database');
    }
  } catch (error) {
    console.error('Error testing Neo4j connection:', error);
  } finally {
    await driver.close();
  }
}

testNeo4jConnection(); 