const neo4j = require('neo4j-driver');

const uri = "bolt://localhost:7687";
const user = "neo4j";
const password = "MillerHouse";

async function createAppointments() {
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  const session = driver.session({ database: 'MillerHouse' });

  try {
    // Create appointments for the next 2 weeks
    const now = new Date();
    const appointments = [];

    // Create 2 appointments per day for the next 14 days
    for (let i = 0; i < 14; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);

      // Morning appointment
      const morningDate = new Date(date);
      morningDate.setHours(10, 0, 0, 0);
      appointments.push({
        date: morningDate.toISOString(),
        status: 'available'
      });

      // Afternoon appointment
      const afternoonDate = new Date(date);
      afternoonDate.setHours(14, 0, 0, 0);
      appointments.push({
        date: afternoonDate.toISOString(),
        status: 'available'
      });
    }

    // Create the appointments in Neo4j
    for (const appointment of appointments) {
      await session.run(
        `CREATE (a:Appointment {
          id: randomUUID(),
          date: datetime($date),
          status: $status
        })`,
        appointment
      );
    }

    console.log('Successfully created appointment slots');
  } catch (error) {
    console.error('Error creating appointments:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

createAppointments(); 