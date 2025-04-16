require('dotenv').config();
const neo4j = require('neo4j-driver');
const { v4: uuidv4 } = require('uuid');

// Database connection settings
const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'Sannas01!';
const dbName = 'MillerHouse';

console.log('Connecting to Neo4j database...');
console.log(`URI: ${uri}, User: ${user}, Database: ${dbName}`);

// Initialize Neo4j driver
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
  encrypted: false,
  trust: 'TRUST_ALL_CERTIFICATES',
  maxConnectionPoolSize: 50
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
    const today = new Date();
    const appointmentsCreated = [];
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const formattedDate = date.toISOString().split('T')[0];
      
      // Morning appointment (9 AM)
      const morningAppointment = {
        id: `morning-${i}-${uuidv4().substring(0, 8)}`,
        date: formattedDate,
        time: '09:00',
        status: 'available',
        createdAt: new Date().toISOString()
      };
      
      // Afternoon appointment (2 PM)
      const afternoonAppointment = {
        id: `afternoon-${i}-${uuidv4().substring(0, 8)}`,
        date: formattedDate,
        time: '14:00',
        status: 'available',
        createdAt: new Date().toISOString()
      };
      
      // Create morning appointment
      await session.run(
        `CREATE (a:Appointment {
          id: $id,
          date: datetime($date),
          time: $time,
          status: $status,
          createdAt: datetime(),
          updatedAt: datetime()
        }) RETURN a`,
        {
          id: morningAppointment.id,
          date: formattedDate,
          time: morningAppointment.time,
          status: morningAppointment.status
        }
      );
      appointmentsCreated.push(morningAppointment);
      
      // Create afternoon appointment
      await session.run(
        `CREATE (a:Appointment {
          id: $id,
          date: datetime($date),
          time: $time,
          status: $status,
          createdAt: datetime(),
          updatedAt: datetime()
        }) RETURN a`,
        {
          id: afternoonAppointment.id,
          date: formattedDate,
          time: afternoonAppointment.time,
          status: afternoonAppointment.status
        }
      );
      appointmentsCreated.push(afternoonAppointment);
    }
    
    console.log(`Created ${appointmentsCreated.length} new appointments`);
    
    // Create some scheduled appointments
    const scheduledAppointments = [
      {
        appointmentId: `scheduled-1-${uuidv4().substring(0, 8)}`,
        date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '10:00',
        leadName: 'John Smith',
        leadEmail: 'john.smith@example.com',
        leadPhone: '555-123-4567'
      },
      {
        appointmentId: `scheduled-2-${uuidv4().substring(0, 8)}`,
        date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        time: '15:30',
        leadName: 'Sarah Johnson',
        leadEmail: 'sarah.j@example.com',
        leadPhone: '555-987-6543'
      }
    ];
    
    for (const apt of scheduledAppointments) {
      // Create lead
      const leadId = `lead-${uuidv4().substring(0, 8)}`;
      await session.run(
        `CREATE (l:Lead {
          id: $id,
          name: $name,
          email: $email,
          phone: $phone,
          qualificationScore: $score,
          status: 'High Priority',
          createdAt: datetime(),
          updatedAt: datetime()
        }) RETURN l`,
        {
          id: leadId,
          name: apt.leadName,
          email: apt.leadEmail,
          phone: apt.leadPhone,
          score: Math.floor(Math.random() * 20) + 30 // Random score 30-50
        }
      );
      
      // Create appointment and relationship
      await session.run(
        `CREATE (a:Appointment {
          id: $id,
          date: datetime($date),
          time: $time,
          status: 'scheduled',
          leadName: $leadName,
          leadEmail: $leadEmail,
          leadPhone: $leadPhone,
          createdAt: datetime(),
          updatedAt: datetime()
        })
        WITH a
        MATCH (l:Lead {id: $leadId})
        CREATE (l)-[:HAS_APPOINTMENT]->(a)
        RETURN a`,
        {
          id: apt.appointmentId,
          date: apt.date,
          time: apt.time,
          leadName: apt.leadName,
          leadEmail: apt.leadEmail,
          leadPhone: apt.leadPhone,
          leadId: leadId
        }
      );
    }
    
    console.log(`Created ${scheduledAppointments.length} scheduled appointments with leads`);
    console.log('Database population completed successfully!');
    
  } catch (error) {
    console.error('Error creating appointments:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

createAppointments(); 