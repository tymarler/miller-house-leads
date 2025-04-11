const express = require('express');
const neo4j = require('neo4j-driver');
const cors = require('cors');
const nodemailer = require('nodemailer');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-specific-password'
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// In-memory storage for leads when Neo4j is not available
let inMemoryLeads = [];

// In-memory storage for appointments
let inMemoryAppointments = [];

// Neo4j connection
const uri = "bolt://localhost:7687";
const user = "neo4j";
const password = "MillerHouse";

console.log('Attempting to connect to Neo4j...');
console.log('URI:', uri);
console.log('User:', user);

let driver;
let neo4jAvailable = false;

try {
  driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
    encrypted: 'ENCRYPTION_OFF',
    trust: 'TRUST_ALL_CERTIFICATES'
  });
  
  // Test database connection
  driver.verifyConnectivity()
    .then(() => {
      console.log('Successfully connected to Neo4j');
      neo4jAvailable = true;
    })
    .catch(error => {
      console.error('Neo4j connection error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.log('Continuing with in-memory storage...');
      neo4jAvailable = false;
    });
} catch (error) {
  console.error('Error creating Neo4j driver:', error);
  console.log('Continuing with in-memory storage...');
  neo4jAvailable = false;
}

// Initialize mock appointments
const initializeMockAppointments = () => {
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    
    // Morning appointment
    const morningDate = new Date(date);
    morningDate.setHours(10, 0, 0, 0);
    inMemoryAppointments.push({
      id: `mock-${i}-morning`,
      date: morningDate.toISOString().split('T')[0],
      time: '10:00',
      status: 'available'
    });
    
    // Afternoon appointment
    const afternoonDate = new Date(date);
    afternoonDate.setHours(14, 0, 0, 0);
    inMemoryAppointments.push({
      id: `mock-${i}-afternoon`,
      date: afternoonDate.toISOString().split('T')[0],
      time: '14:00',
      status: 'available'
    });
  }
};

// Initialize mock appointments when server starts
initializeMockAppointments();

// API Endpoints
app.post('/api/leads', async (req, res) => {
  try {
    const leadData = {
      ...req.body,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    // Send email based on qualification status
    if (leadData.score >= 25) { // Medium or High priority
      await sendEmail(
        leadData.email,
        leadData.emailSubject || 'Thank you for your interest in Miller House',
        leadData.emailBody || 'We will contact you shortly to schedule your consultation.',
        `<div>
          <h2>Thank you for your interest in Miller House</h2>
          <p>${leadData.emailBody || 'We will contact you shortly to schedule your consultation.'}</p>
          <p>Best regards,<br>Miller House Team</p>
        </div>`
      );
    } else {
      await sendEmail(
        leadData.email,
        'Thank you for your interest in Miller House',
        'Thank you for your interest. We will review your information and contact you if we can assist with your project.',
        `<div>
          <h2>Thank you for your interest in Miller House</h2>
          <p>Thank you for your interest. We will review your information and contact you if we can assist with your project.</p>
          <p>Best regards,<br>Miller House Team</p>
        </div>`
      );
    }

    if (neo4jAvailable) {
      const session = driver.session({ database: 'MillerHouse' });
      try {
        await session.run(
          `CREATE (l:Lead {
            name: $name,
            email: $email,
            phone: $phone,
            state: $state,
            squareFootage: $squareFootage,
            lotSize: $lotSize,
            timeline: $timeline,
            financing: $financing,
            lotStatus: $lotStatus,
            urgency: $urgency,
            qualificationScore: $qualificationScore,
            createdAt: datetime()
          }) RETURN l`,
          leadData
        );
        res.json({ success: true, message: 'Lead created successfully' });
      } catch (error) {
        console.error('Error saving to Neo4j:', error);
        // Fallback to in-memory storage
        inMemoryLeads.push(leadData);
        res.json({ success: true, message: 'Lead saved in temporary storage' });
      } finally {
        await session.close();
      }
    } else {
      // Use in-memory storage
      inMemoryLeads.push(leadData);
      res.json({ success: true, message: 'Lead saved in temporary storage' });
    }
  } catch (error) {
    console.error('Error saving lead:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save lead data. Please try again or contact support.',
      details: error.message 
    });
  }
});

// Get all leads
app.get('/api/leads', async (req, res) => {
  try {
    if (neo4jAvailable) {
      const session = driver.session({ database: 'MillerHouse' });
      try {
        const result = await session.run('MATCH (l:Lead) RETURN l ORDER BY l.createdAt DESC');
        const leads = result.records.map(record => record.get('l').properties);
        res.json(leads);
      } catch (error) {
        console.error('Error fetching from Neo4j:', error);
        res.json(inMemoryLeads);
      } finally {
        await session.close();
      }
    } else {
      res.json(inMemoryLeads);
    }
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch leads. Please try again.',
      details: error.message 
    });
  }
});

// Get available appointments
app.get('/api/appointments', async (req, res) => {
  try {
    if (neo4jAvailable) {
      const session = driver.session({ database: 'MillerHouse' });
      try {
        const result = await session.run(
          `MATCH (a:Appointment)
           WHERE a.status = 'available'
           AND a.date >= datetime()
           RETURN a
           ORDER BY a.date
           LIMIT 10`
        );
        const appointments = result.records.map(record => {
          const props = record.get('a').properties;
          return {
            id: props.id,
            date: props.date.toString().split('T')[0],
            time: props.date.toString().split('T')[1].substring(0, 5),
            status: props.status
          };
        });
        res.json(appointments);
      } catch (error) {
        console.error('Error fetching from Neo4j:', error);
        res.json(inMemoryAppointments);
      } finally {
        await session.close();
      }
    } else {
      res.json(inMemoryAppointments);
    }
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Schedule an appointment
app.post('/api/appointments/schedule', async (req, res) => {
  try {
    const { date, time } = req.body;
    
    if (neo4jAvailable) {
      const session = driver.session({ database: 'MillerHouse' });
      try {
        // First verify the lead's qualification score
        const leadResult = await session.run(
          'MATCH (l:Lead {email: $email}) RETURN l.qualificationScore as score',
          { email: req.body.leadEmail }
        );
        
        if (leadResult.records.length === 0) {
          res.status(404).json({ success: false, message: 'Lead not found' });
          return;
        }
        
        const score = leadResult.records[0].get('score');
        if (score < 15) {
          res.status(403).json({ success: false, message: 'Lead does not meet minimum qualification score' });
          return;
        }
        
        // Schedule the appointment
        const result = await session.run(
          `MATCH (a:Appointment {id: $appointmentId})
           MATCH (l:Lead {email: $leadEmail})
           WHERE a.status = 'available'
           SET a.status = 'scheduled'
           CREATE (l)-[:SCHEDULED]->(a)
           RETURN a`,
          { appointmentId: req.body.appointmentId, leadEmail: req.body.leadEmail }
        );
        
        if (result.records.length === 0) {
          res.status(404).json({ success: false, message: 'Appointment not available' });
          return;
        }
        
        res.json({ success: true, message: 'Appointment scheduled successfully' });
      } catch (error) {
        console.error('Error scheduling in Neo4j:', error);
        // Fall back to in-memory scheduling
        const appointment = inMemoryAppointments.find(a => 
          a.date === date && a.time === time && a.status === 'available'
        );
        
        if (appointment) {
          appointment.status = 'scheduled';
          res.json({ success: true, message: 'Appointment scheduled successfully' });
        } else {
          res.status(404).json({ success: false, message: 'Appointment not available' });
        }
      } finally {
        await session.close();
      }
    } else {
      // In-memory scheduling
      const appointment = inMemoryAppointments.find(a => 
        a.date === date && a.time === time && a.status === 'available'
      );
      
      if (appointment) {
        appointment.status = 'scheduled';
        res.json({ success: true, message: 'Appointment scheduled successfully' });
      } else {
        res.status(404).json({ success: false, message: 'Appointment not available' });
      }
    }
  } catch (error) {
    console.error('Error scheduling appointment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get lead by email
app.get('/api/leads/:email', async (req, res) => {
  const session = driver.session({ database: 'MillerHouse' });
  try {
    const result = await session.run(
      'MATCH (l:Lead {email: $email}) RETURN l',
      { email: req.params.email }
    );
    if (result.records.length === 0) {
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }
    res.json(result.records[0].get('l').properties);
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await session.close();
  }
});

// Get existing appointment for a lead
app.get('/api/appointments/lead/:email', async (req, res) => {
  const session = driver.session({ database: 'MillerHouse' });
  try {
    const result = await session.run(
      `MATCH (l:Lead {email: $email})-[:SCHEDULED]->(a:Appointment)
       WHERE a.status = 'scheduled'
       RETURN a
       ORDER BY a.date
       LIMIT 1`,
      { email: req.params.email }
    );
    
    if (result.records.length === 0) {
      res.json({ hasAppointment: false });
      return;
    }
    
    const appointment = result.records[0].get('a').properties;
    res.json({
      hasAppointment: true,
      appointment: {
        id: appointment.id,
        date: appointment.date.toString(),
        status: appointment.status
      }
    });
  } catch (error) {
    console.error('Error checking appointment:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await session.close();
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await driver.close();
    console.log('Neo4j connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error closing Neo4j connection:', error);
    process.exit(1);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 