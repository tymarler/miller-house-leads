const neo4j = require('neo4j-driver');
require('dotenv').config();

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

async function setupSalesman() {
  const session = driver.session();
  
  try {
    // Create Jay as a salesman
    const result = await session.run(
      `CREATE (s:Salesman {
        id: randomUUID(),
        name: "Jay",
        email: "jay@millerhouse.com",
        phone: "555-123-4567",
        createdAt: datetime()
      })
      RETURN s.id as id`
    );
    
    const jayId = result.records[0].get('id');
    console.log('Created Jay with ID:', jayId);
    
  } catch (error) {
    console.error('Error setting up salesman:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

setupSalesman(); 