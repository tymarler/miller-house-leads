const neo4j = require('neo4j-driver');
require('dotenv').config();

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

async function addAppointments() {
  const session = driver.session();
  
  try {
    // First, get Jay's salesman ID
    const salesmanResult = await session.run(
      'MATCH (s:Salesman {name: "Jay"}) RETURN s.id as id'
    );
    
    if (salesmanResult.records.length === 0) {
      console.error('Salesman Jay not found');
      return;
    }
    
    const jayId = salesmanResult.records[0].get('id');
    console.log('Found Jay with ID:', jayId);
    
    // Generate appointments for the next 2 months
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 2);
    
    const appointments = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // Only add appointments for weekdays (Monday through Friday)
      if (currentDate.getDay() >= 1 && currentDate.getDay() <= 5) {
        // Add appointments every 2 hours from 8am to 8pm
        for (let hour = 8; hour <= 20; hour += 2) {
          const appointmentDate = new Date(currentDate);
          appointmentDate.setHours(hour, 0, 0, 0);
          
          appointments.push({
            date: appointmentDate.toISOString().split('T')[0],
            time: `${hour.toString().padStart(2, '0')}:00`,
            salesmanId: jayId
          });
        }
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log(`Generated ${appointments.length} appointments`);
    
    // Add appointments to database
    for (const appointment of appointments) {
      await session.run(
        `MATCH (s:Salesman {id: $salesmanId})
         CREATE (a:Appointment {
           id: randomUUID(),
           date: $date,
           time: $time,
           status: 'available',
           createdAt: datetime()
         })
         CREATE (s)-[:OFFERS_APPOINTMENT]->(a)`,
        appointment
      );
    }
    
    console.log('Successfully added all appointments');
    
  } catch (error) {
    console.error('Error adding appointments:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

addAppointments(); 