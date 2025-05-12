const { v4: uuidv4 } = require('uuid');
const { executeQuery, isConnected } = require('../config/database');
const { driver, dbName } = require('../config/database');

// In-memory storage for fallback
let appointments = [];

// Create a new appointment
async function createAppointment(appointment) {
  try {
    if (isConnected) {
      const session = driver.session({ database: dbName });
      try {
        const result = await session.run(
          `CREATE (a:Appointment {
            id: $id,
            leadId: $leadId,
            datetime: datetime($datetime),
            status: $status
          }) RETURN a`,
          {
            id: appointment.id,
            leadId: appointment.leadId,
            datetime: appointment.datetime,
            status: appointment.status
          }
        );
        return result.records[0].get('a').properties;
      } finally {
        await session.close();
      }
    }
    appointments.push(appointment);
    return appointment;
  } catch (error) {
    console.error('Error creating appointment:', error);
    appointments.push(appointment);
    return appointment;
  }
}

// Get all appointments
async function getAppointments() {
  try {
    if (isConnected) {
      const session = driver.session({ database: dbName });
      try {
        const now = new Date();
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        
        const result = await session.run(`
          MATCH (a:Appointment)
          WHERE datetime(a.datetime) > datetime($minDateTime)
          AND datetime(a.datetime) > datetime()
          RETURN a
          ORDER BY a.datetime
        `, { minDateTime: twoHoursFromNow.toISOString() });
        
        return result.records.map(record => {
          const appointment = record.get('a').properties;
          
          // Convert Neo4j DateTime to JavaScript Date
          if (appointment.datetime) {
            const dt = appointment.datetime;
            const jsDate = new Date(Date.UTC(
              dt.year.low,
              dt.month.low - 1,
              dt.day.low,
              dt.hour.low,
              dt.minute.low,
              dt.second.low,
              dt.nanosecond.low / 1000000
            ));
            
            if (!isNaN(jsDate.getTime())) {
              appointment.datetime = jsDate.toISOString();
              appointment.timestamp = jsDate.getTime();
            }
          }
          
          return appointment;
        });
      } finally {
        await session.close();
      }
    }
    return appointments;
  } catch (error) {
    console.error('Error getting appointments:', error);
    return appointments;
  }
}

// Get appointments by lead ID
async function getAppointmentsByLeadId(leadId) {
  try {
    if (isConnected) {
      const session = driver.session({ database: dbName });
      try {
        const result = await session.run(`
          MATCH (l:Lead {id: $leadId})-[:HAS_APPOINTMENT]->(a:Appointment)
          WHERE datetime(a.datetime) > datetime()
          RETURN a
          ORDER BY a.datetime
        `, { leadId });
        return result.records.map(record => record.get('a').properties);
      } finally {
        await session.close();
      }
    }
    return appointments.filter(a => a.leadId === leadId);
  } catch (error) {
    console.error('Error getting appointments by lead ID:', error);
    return appointments.filter(a => a.leadId === leadId);
  }
}

// Update appointment status
async function updateAppointmentStatus(id, status) {
  try {
    if (isConnected) {
      const session = driver.session({ database: dbName });
      try {
        const result = await session.run(`
          MATCH (a:Appointment {id: $id})
          SET a.status = $status,
              a.updatedAt = datetime()
          RETURN a
        `, { id, status });
        return result.records[0].get('a').properties;
      } finally {
        await session.close();
      }
    }
    const appointment = appointments.find(a => a.id === id);
    if (appointment) {
      appointment.status = status;
    }
    return appointment;
  } catch (error) {
    console.error('Error updating appointment status:', error);
    const appointment = appointments.find(a => a.id === id);
    if (appointment) {
      appointment.status = status;
    }
    return appointment;
  }
}

// Check if a time slot is available
async function isTimeSlotAvailable(datetime) {
  try {
    if (isConnected) {
      const session = driver.session({ database: dbName });
      try {
        const result = await session.run(`
          MATCH (a:Appointment)
          WHERE datetime(a.datetime) = datetime($datetime)
          AND a.status = 'available'
          AND NOT EXISTS((:Lead)-[:HAS_APPOINTMENT]->(a))
          RETURN count(a) as count
        `, { datetime });
        return result.records[0].get('count').low > 0;
      } finally {
        await session.close();
      }
    }
    return !appointments.some(a => 
      a.datetime === datetime && 
      (a.status !== 'available' || a.leadId)
    );
  } catch (error) {
    console.error('Error checking time slot availability:', error);
    return !appointments.some(a => 
      a.datetime === datetime && 
      (a.status !== 'available' || a.leadId)
    );
  }
}

// Initialize mock appointments
async function initializeMockAppointments() {
  try {
    if (isConnected) {
      const session = driver.session({ database: dbName });
      try {
        // Create appointments for the next 14 days
        const now = new Date();
        const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        
        for (let date = new Date(now); date <= twoWeeksFromNow; date.setDate(date.getDate() + 1)) {
          // Skip weekends
          if (date.getDay() === 0 || date.getDay() === 6) continue;
          
          // Create appointments for each time slot
          for (let hour = 9; hour <= 17; hour++) {
            const appointmentDateTime = new Date(date);
            appointmentDateTime.setHours(hour, 0, 0, 0);
            
            // Skip if the appointment is in the past
            if (appointmentDateTime < now) continue;
            
            await session.run(`
              MERGE (a:Appointment {datetime: datetime($datetime)})
              ON CREATE SET a += {
                id: $id,
                status: 'available',
                createdAt: datetime()
              }
            `, {
              datetime: appointmentDateTime.toISOString(),
              id: uuidv4()
            });
          }
        }
        
        console.log('Mock appointments initialized successfully');
      } finally {
        await session.close();
      }
    }
  } catch (error) {
    console.error('Error initializing mock appointments:', error);
  }
}

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentsByLeadId,
  updateAppointmentStatus,
  isTimeSlotAvailable,
  initializeMockAppointments
}; 