const neo4j = require('neo4j-driver');
const { driver, config, executeQuery } = require('./src/config/database');

async function setupSalesman() {
  try {
    await executeQuery(driver, async (session) => {
      // Create Salesman nodes
      await session.run(`
        CREATE (s1:Salesman {id: '1', name: 'John Doe', email: 'john@example.com'})
        CREATE (s2:Salesman {id: '2', name: 'Jane Smith', email: 'jane@example.com'})
        CREATE (s3:Salesman {id: '3', name: 'Bob Johnson', email: 'bob@example.com'})
      `);
      console.log('Salesmen created successfully');
    });
  } catch (error) {
    console.error('Error setting up salesmen:', error);
  } finally {
    await driver.close();
  }
}

setupSalesman(); 