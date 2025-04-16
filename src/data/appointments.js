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
            date: $date,
            time: $time,
            status: $status
          }) RETURN a`,
          {
            id: appointment.id,
            leadId: appointment.leadId,
            date: appointment.date,
            time: appointment.time,
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
        const result = await session.run('MATCH (a:Appointment) RETURN a');
        return result.records.map(record => record.get('a').properties);
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
        const result = await session.run(
          'MATCH (a:Appointment {leadId: $leadId}) RETURN a',
          { leadId }
        );
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
        const result = await session.run(
          'MATCH (a:Appointment {id: $id}) SET a.status = $status RETURN a',
          { id, status }
        );
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
async function isTimeSlotAvailable(date, time) {
  if (isConnected) {
    try {
      return await executeQuery(async (session) => {
        const result = await session.run(
          'MATCH (a:Appointment {date: $date, time: $time}) RETURN count(a) as count',
          { date, time }
        );
        return result.records[0].get('count').toNumber() === 0;
      });
    } catch (error) {
      console.error('Failed to check time slot availability in Neo4j:', error);
      return !appointments.some(app => app.date === date && app.time === time);
    }
  }
  return !appointments.some(app => app.date === date && app.time === time);
}

// Initialize mock appointments
function initializeMockAppointments() {
  if (appointments.length === 0) {
    const today = new Date();
    const mockLeads = [
      { id: 'lead1', name: 'John Doe', email: 'john@example.com' },
      { id: 'lead2', name: 'Jane Smith', email: 'jane@example.com' }
    ];

    // Create appointments for the next 14 days
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      // Morning appointment
      appointments.push({
        id: uuidv4(),
        leadId: mockLeads[0].id,
        date: dateStr,
        time: '09:00',
        status: 'scheduled',
        createdAt: new Date().toISOString()
      });

      // Afternoon appointment
      appointments.push({
        id: uuidv4(),
        leadId: mockLeads[1].id,
        date: dateStr,
        time: '14:00',
        status: 'scheduled',
        createdAt: new Date().toISOString()
      });
    }
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