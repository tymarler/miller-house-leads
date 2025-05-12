const neo4j = require('neo4j-driver');
const { driver, config, executeQuery } = require('./src/config/database');

async function addAppointments() {
  try {
    await executeQuery(driver, async (session) => {
      // Add new appointments
      const result = await session.run(`
        CREATE (a1:Appointment {
          id: 'new-1',
          date: '2024-03-21',
          time: '09:00',
          status: 'available',
          type: 'consultation'
        })
        CREATE (a2:Appointment {
          id: 'new-2',
          date: '2024-03-21',
          time: '10:00',
          status: 'available',
          type: 'consultation'
        })
        RETURN count(*) as count
      `);
      console.log(`Added ${result.records[0].get('count').toNumber()} new appointments`);
    });
  } catch (error) {
    console.error('Error adding appointments:', error);
  } finally {
    await driver.close();
  }
}

addAppointments(); 