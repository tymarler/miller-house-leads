const neo4j = require('neo4j-driver');
const { v4: uuidv4 } = require('uuid');
const { driver, dbName } = require('./src/config/database');

async function assignSalesmanToAppointments() {
  const session = driver.session({ database: dbName });
  try {
    console.log('Starting to assign Jay to all appointments...');

    // First, get or create Jay as a salesman
    const createSalesmanResult = await session.run(`
      MERGE (s:Salesman {name: 'Jay'})
      ON CREATE SET s.id = $jayId,
                    s.createdAt = datetime()
      RETURN s
    `, { jayId: uuidv4() });

    const jayId = createSalesmanResult.records[0].get('s').properties.id;
    console.log('Jay\'s ID:', jayId);

    // Assign Jay to all appointments
    const assignResult = await session.run(`
      MATCH (a:Appointment)
      MATCH (s:Salesman {id: $jayId})
      MERGE (s)-[r:HAS_APPOINTMENT]->(a)
      RETURN count(a) as count
    `, { jayId });

    const count = assignResult.records[0].get('count').low;
    console.log(`Successfully assigned Jay to ${count} appointments`);

  } catch (error) {
    console.error('Error assigning salesman:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

assignSalesmanToAppointments(); 