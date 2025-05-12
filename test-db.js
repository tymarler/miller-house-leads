const { driver, testConnection, closeDriver } = require('./src/config/database');

async function testDatabaseConnection() {
  try {
    console.log('Testing Neo4j connection...');
    const connected = await testConnection(driver);
    if (connected) {
      console.log('Successfully connected to Neo4j database!');
    } else {
      console.error('Failed to connect to Neo4j database');
    }
  } catch (error) {
    console.error('Error testing database connection:', error);
  } finally {
    await closeDriver(driver);
  }
}

testDatabaseConnection(); 