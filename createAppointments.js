require('dotenv').config();
const neo4j = require('neo4j-driver');
const { v4: uuidv4 } = require('uuid');

// Database connection settings
const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'MillerHouse123!';
const dbName = 'MillerHouse';

console.log('Connecting to Neo4j database...');
console.log(`URI: ${uri}, User: ${user}, Database: ${dbName}`);

// Initialize Neo4j driver
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
  maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
  maxConnectionPoolSize: 50,
  connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
});

// Create appointments for the next 14 days
async function createAppointments() {
  const session = driver.session({ database: dbName });
  try {
    console.log('Connected to Neo4j. Creating appointments...');
    
    // First clean up any existing appointments with status 'available'
    const deleteResult = await session.run(
      'MATCH (a:Appointment {status: "available"}) DETACH DELETE a'
    );
    console.log(`Deleted existing available appointments`);
    
    // Create appointments for the next 14 days
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    const appointmentsCreated = [];
    
    // Create appointments for each day
    for (let date = new Date(now); date <= twoWeeksFromNow; date.setDate(date.getDate() + 1)) {
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Create appointments for each time slot
      for (let hour = 9; hour <= 17; hour++) {
        const appointmentDateTime = new Date(date);
        appointmentDateTime.setHours(hour, 0, 0, 0);
        
        // Skip if the appointment is in the past
        if (appointmentDateTime < now) continue;
        
        const appointmentId = uuidv4();
        
        await session.run(`
          MERGE (a:Appointment {datetime: datetime($datetime)})
          ON CREATE SET a += {
            id: $id,
            status: 'available',
            createdAt: datetime()
          }
        `, {
          datetime: appointmentDateTime.toISOString(),
          id: appointmentId
        });
        
        appointmentsCreated.push({
          id: appointmentId,
          datetime: appointmentDateTime.toISOString(),
          status: 'available'
        });
      }
    }
    
    console.log(`Created ${appointmentsCreated.length} new appointments`);
    
    // Create some scheduled appointments
    const scheduledAppointments = [
      {
        appointmentId: `scheduled-1-${uuidv4().substring(0, 8)}`,
        datetime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        leadName: 'John Smith',
        leadEmail: 'john.smith@example.com',
        leadPhone: '555-123-4567'
      },
      {
        appointmentId: `scheduled-2-${uuidv4().substring(0, 8)}`,
        datetime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        leadName: 'Sarah Johnson',
        leadEmail: 'sarah.j@example.com',
        leadPhone: '555-987-6543'
      }
    ];
    
    // Create scheduled appointments
    for (const appointment of scheduledAppointments) {
      // Create lead
      await session.run(`
        MERGE (l:Lead {email: $email})
        ON CREATE SET l += {
          id: $id,
          name: $name,
          phone: $phone,
          createdAt: datetime()
        }
        ON MATCH SET l += {
          name: $name,
          phone: $phone,
          updatedAt: datetime()
        }
        RETURN l
      `, {
        id: uuidv4(),
        name: appointment.leadName,
        email: appointment.leadEmail,
        phone: appointment.leadPhone
      });
      
      // Create appointment and link to lead
      await session.run(`
        CREATE (a:Appointment {
          id: $id,
          datetime: datetime($datetime),
          status: 'booked',
          createdAt: datetime()
        })
        WITH a
        MATCH (l:Lead {email: $email})
        CREATE (l)-[r:HAS_APPOINTMENT {createdAt: datetime()}]->(a)
        RETURN a, l, r
      `, {
        id: appointment.appointmentId,
        datetime: appointment.datetime,
        email: appointment.leadEmail
      });
    }
    
    console.log(`Created ${scheduledAppointments.length} scheduled appointments`);
    console.log('Database population completed successfully!');
    
  } catch (error) {
    console.error('Error creating appointments:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

// Run the script
createAppointments()
  .then(() => console.log('Finished creating appointments'))
  .catch(error => console.error('Error:', error)); 