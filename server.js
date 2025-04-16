const express = require('express');
const neo4j = require('neo4j-driver');
const cors = require('cors');
const nodemailer = require('nodemailer');
const app = express();
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const db = require('./src/config/database');
const leadsData = require('./src/data/leads');
const appointmentsData = require('./src/data/appointments');

// Set port consistently
const PORT = 3001;

// Middleware
app.use(cors({
  origin: '*',  // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Email configuration
const transporter = nodemailer.createTransport({
  // Using Gmail SMTP settings
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // Use app password if 2FA is enabled
  },
  tls: {
    rejectUnauthorized: false // Helps with self-signed certificates (remove in production)
  },
  debug: true, // Enable debug logs for troubleshooting
  logger: true  // Enable logger
});

// Function to send email with better error handling
const sendEmail = async (to, subject, text, html) => {
  try {
    console.log('Attempting to send email to:', to);
    console.log('Using email account:', process.env.EMAIL_USER);
    
    // Verify SMTP configuration is working before sending
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    
    const mailOptions = {
      from: `"Miller House Studio" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Error code:', error.code);
    console.error('Error command:', error.command);
    console.error('Error response:', error.response);
    return { 
      success: false, 
      error: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    };
  }
};

// Initialize storage
const storage = {
  leads: [],
  appointments: []
};

// Initialize mock data (empty implementations)
function initializeMockLeads() {
  console.log('Mock leads initialization skipped by user request');
  storage.leads = [];
}

function initializeMockAppointments() {
  console.log('Mock appointments initialization skipped by user request');
  storage.appointments = [];
}

// Initialize Neo4j driver
const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'Sannas01!';
const dbName = 'MillerHouse';

let driver = null;
let isConnected = false;
let connectionError = null;

// Initialize Neo4j driver with better error handling
async function initializeDriver() {
  try {
    console.log('Attempting to connect to Neo4j...');
    console.log('URI:', uri);
    console.log('User:', user);
    console.log('Database:', dbName);
    
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      encrypted: false,
      trust: 'TRUST_ALL_CERTIFICATES',
      maxConnectionPoolSize: 50,
      connectionTimeout: 30000,
      maxRetryTime: 30000,
      retryDelay: 1000,
      maxRetries: 3
    });
    
    // Test the connection
    const session = driver.session({ database: dbName });
    try {
      await session.run('RETURN 1');
      console.log('Neo4j connection test successful');
      isConnected = true;
      connectionError = null;
    } catch (error) {
      console.error('Neo4j connection test failed:', error.message);
      isConnected = false;
      connectionError = error;
      throw error;
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Neo4j connection error:', error);
    isConnected = false;
    connectionError = error;
    console.log('Continuing with in-memory storage...');
    // Initialize mock data
    initializeMockLeads();
    initializeMockAppointments();
  }
}

// Test the connection with detailed error reporting
async function testConnection() {
  if (!driver) {
    throw new Error('Neo4j driver not initialized');
  }
  
  const session = driver.session({ database: dbName });
  try {
    const result = await session.run('RETURN 1 as test');
    console.log('Neo4j connection test successful');
    isConnected = true;
    connectionError = null;
    return true;
  } catch (error) {
    console.error('Neo4j connection test failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    connectionError = error;
    isConnected = false;
    throw error;
  } finally {
    await session.close();
  }
}

// Initialize database schema and constraints
async function initializeDatabase() {
  const session = driver.session({ database: dbName });
  try {
    console.log('Setting up database schema...');
    
    // Create constraints to ensure uniqueness and enable indexing
    await session.run('CREATE CONSTRAINT lead_id IF NOT EXISTS FOR (l:Lead) REQUIRE l.id IS UNIQUE');
    await session.run('CREATE CONSTRAINT appointment_id IF NOT EXISTS FOR (a:Appointment) REQUIRE a.id IS UNIQUE');
    await session.run('CREATE INDEX lead_email_idx IF NOT EXISTS FOR (l:Lead) ON (l.email)');
    await session.run('CREATE INDEX appointment_date_idx IF NOT EXISTS FOR (a:Appointment) ON (a.date)');
    
    // Check if we need to initialize appointments
    const countResult = await session.run('MATCH (a:Appointment) RETURN count(a) as count');
    const appointmentCount = countResult.records[0].get('count').toNumber();
    
    if (appointmentCount === 0) {
      console.log('No appointments found, initializing default appointments...');
      await initializeAppointments();
    } else {
      console.log(`Found ${appointmentCount} existing appointments, skipping initialization`);
    }
    
    console.log('Database schema setup complete');
    return true;
  } catch (error) {
    console.error('Error setting up database schema:', error);
    throw error;
  } finally {
    await session.close();
  }
}

// Initialize appointments in Neo4j
async function initializeAppointments() {
  const session = driver.session({ database: dbName });
  try {
    // Create appointments for the next 14 days
    const today = new Date();
    const batchSize = 10; // Process in batches for better performance
    const totalDays = 14;
    
    for (let batchStart = 0; batchStart < totalDays; batchStart += batchSize) {
      const batch = [];
      const batchEnd = Math.min(batchStart + batchSize, totalDays);
      
      for (let i = batchStart; i < batchEnd; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const formattedDate = date.toISOString().split('T')[0];
        
        // Morning appointment (9 AM)
        batch.push({
          id: `morning-${i}`,
          date: formattedDate,
          time: '09:00',
          status: 'available',
          type: 'Morning'
        });
        
        // Afternoon appointment (2 PM)
        batch.push({
          id: `afternoon-${i}`,
          date: formattedDate,
          time: '14:00',
          status: 'available',
          type: 'Afternoon'
        });
      }
      
      // Use UNWIND for batch processing
      await session.run(`
        UNWIND $appointments AS appt
        CREATE (a:Appointment {
          id: appt.id,
          date: date(appt.date),
          time: appt.time,
          status: appt.status,
          type: appt.type,
          createdAt: datetime()
        })
      `, { appointments: batch });
    }
    
    console.log('Successfully initialized appointments in Neo4j');
  } catch (error) {
    console.error('Error initializing appointments:', error);
    throw error;
  } finally {
    await session.close();
  }
}

// Initialize the application with better error handling
async function initializeApp() {
  try {
    console.log('Starting application initialization...');
    await initializeDriver();
    
    if (isConnected) {
      console.log('Connected to Neo4j, initializing database...');
      await initializeDatabase();
      
      // Just check for leads without creating mock data
      console.log('Checking existing leads...');
      const session = driver.session({ database: dbName });
      try {
        const result = await session.run('MATCH (l:Lead) RETURN count(l) as count');
        const count = result.records[0].get('count').toNumber();
        console.log(`Found ${count} existing leads in database`);
      } finally {
        await session.close();
      }
    } else {
      console.log('Using in-memory storage...');
      // Don't initialize mock data
      console.log('Skipping mock data initialization');
    }
  } catch (error) {
    console.error('Error during initialization:', error);
    isConnected = false;
  }
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} (accessible at http://localhost:${PORT})`);
    console.log(`Neo4j connection status: ${isConnected ? 'Connected' : 'Disconnected'}`);
    if (connectionError) {
      console.error('Last connection error:', connectionError.message);
    }
  });
}

// Start the application
initializeApp();

const getEmailTemplate = (leadData, appointmentDetails) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c5282;">Thank you for scheduling your consultation!</h2>
      
      <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #2d3748;">Your Appointment Details:</h3>
        <p><strong>Date:</strong> ${appointmentDetails.date}</p>
        <p><strong>Time:</strong> ${appointmentDetails.time}</p>
      </div>

      <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #2d3748;">Pre-Consultation Questionnaire</h3>
        <p>To help us make the most of our time together, please review and prepare answers to the following questions:</p>
        
        <ol style="list-style-type: decimal; padding-left: 20px;">
          <li>Are you ready to design your new home?</li>
          <li>Number of vehicle parking spaces: ____</li>
          <li>Type of space (under roof garage, detached covered, uncovered): ____________</li>
          <li>Will there be outdoor living space(s)? _______</li>
          <li>With outdoor kitchen area? _______</li>
          <li>Number of bedrooms range: ______</li>
          <li>Number of bathrooms: ______</li>
          <li>Number of Living Areas: _____</li>
          <li>Number of levels? ________</li>
          <li>What is the desired completion date for your new home? ________</li>
          <li>Are you aware of the permitting requirements for the building (HOA, sanitary sewer, building codes)? ________</li>
          <li>Do you have a survey of the lot that you are building on? ________</li>
          <li>Do you have a surface topography of the lot that you are building on? ________</li>
          <li>Do you have inspirational photos, drawings, articles, online sources etc. that will help with the creation of your home's design? _________</li>
          <li>Has a general contractor been selected? ________</li>
          <li>Has general consideration been given to the finish details of the home?</li>
          <ul>
            <li>Exterior finish: __________</li>
            <li>Roof type: ___________</li>
            <li>Countertop materials: ____________</li>
            <li>Flooring materials: __________</li>
          </ul>
          <li>What space is the most important to you? __________</li>
          <li>Are there any challenges or concerns that you would like to address? ________</li>
          <li>Once this worksheet has satisfactorily been completed are you ready to move to the design phase assuming that the terms are agreeable? ______</li>
        </ol>
      </div>

      <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #2d3748;">What to Expect</h3>
        <p>During our consultation, we will:</p>
        <ul>
          <li>Review your answers to these questions</li>
          <li>Discuss your vision for your new home</li>
          <li>Explore design options and possibilities</li>
          <li>Address any concerns or questions you may have</li>
        </ul>
      </div>

      <p style="color: #718096; font-size: 14px; margin-top: 20px;">
        If you need to reschedule or have any questions, please contact us at your earliest convenience.
      </p>
    </div>
  `;

  const text = `
    Thank you for scheduling your consultation!

    Your Appointment Details:
    Date: ${appointmentDetails.date}
    Time: ${appointmentDetails.time}

    Pre-Consultation Questionnaire:
    Please review and prepare answers to the following questions:

    1. Are you ready to design your new home?
    2. Number of vehicle parking spaces: ____
    3. Type of space (under roof garage, detached covered, uncovered): ____________
    4. Will there be outdoor living space(s)? _______
    5. With outdoor kitchen area? _______
    6. Number of bedrooms range: ______
    7. Number of bathrooms: ______
    8. Number of Living Areas: _____
    9. Number of levels? ________
    10. What is the desired completion date for your new home? ________
    11. Are you aware of the permitting requirements for the building (HOA, sanitary sewer, building codes)? ________
    12. Do you have a survey of the lot that you are building on? ________
    13. Do you have a surface topography of the lot that you are building on? ________
    14. Do you have inspirational photos, drawings, articles, online sources etc. that will help with the creation of your home's design? _________
    15. Has a general contractor been selected? ________
    16. Has general consideration been given to the finish details of the home?
       - Exterior finish: __________
       - Roof type: ___________
       - Countertop materials: ____________
       - Flooring materials: __________
    17. What space is the most important to you? __________
    18. Are there any challenges or concerns that you would like to address? ________
    19. Once this worksheet has satisfactorily been completed are you ready to move to the design phase assuming that the terms are agreeable? ______

    What to Expect:
    During our consultation, we will:
    - Review your answers to these questions
    - Discuss your vision for your new home
    - Explore design options and possibilities
    - Address any concerns or questions you may have

    If you need to reschedule or have any questions, please contact us at your earliest convenience.
  `;

  return { html, text };
};

// Helper function to handle database operations with fallback
async function executeWithFallback(operation, fallbackOperation) {
  if (!isConnected || !driver) {
    console.warn('Database not connected, using fallback operation');
    return await fallbackOperation();
  }

  const session = driver.session({ database: dbName });
  try {
    return await operation(session);
  } catch (error) {
    console.error('Database operation failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.warn('Falling back to in-memory storage');
    return await fallbackOperation();
  } finally {
    await session.close();
  }
}

// API endpoints
app.post('/api/leads', async (req, res) => {
  try {
    const { name, email, phone, state, squareFootage, timeline, financingStatus, lotStatus } = req.body;
    
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate qualification score
    let qualificationScore = 0;
    
    // Timeline scoring
    if (timeline === 'Immediate') qualificationScore += 15;
    else if (timeline === '3-6 months') qualificationScore += 10;
    else if (timeline === '6-12 months') qualificationScore += 5;
    
    // Financing scoring
    if (financingStatus === 'Ready to proceed') qualificationScore += 15;
    else if (financingStatus === 'Pre-approved') qualificationScore += 10;
    else if (financingStatus === 'In process') qualificationScore += 5;
    
    // Lot status scoring
    if (lotStatus === 'Owned') qualificationScore += 15;
    else if (lotStatus === 'Under contract') qualificationScore += 10;
    else if (lotStatus === 'Looking') qualificationScore += 5;

    const lead = {
      id: uuidv4(),
      name,
      email,
      phone,
      state: state || '',
      squareFootage: squareFootage || '',
      timeline: timeline || '',
      financingStatus: financingStatus || '',
      lotStatus: lotStatus || '',
      qualificationScore,
      status: 'New',
      createdAt: new Date().toISOString()
    };
    
    if (!isConnected) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected',
        message: 'Cannot create lead without database connection'
      });
    }
    
    const session = driver.session({ database: dbName });
    try {
      // First check if lead with same email exists
      const checkResult = await session.run(
        'MATCH (l:Lead {email: $email}) RETURN l',
        { email: lead.email }
      );
      
      if (checkResult.records.length > 0) {
        // Lead exists, update instead of create
        const existingLead = checkResult.records[0].get('l').properties;
        const updateResult = await session.run(
          `MATCH (l:Lead {id: $id})
           SET l.name = $name,
               l.phone = $phone,
               l.state = $state,
               l.squareFootage = $squareFootage,
               l.timeline = $timeline,
               l.financingStatus = $financingStatus,
               l.lotStatus = $lotStatus,
               l.qualificationScore = $qualificationScore,
               l.status = $status,
               l.updatedAt = datetime()
           RETURN l`,
          {
            id: existingLead.id,
            name: lead.name,
            phone: lead.phone,
            state: lead.state,
            squareFootage: lead.squareFootage,
            timeline: lead.timeline,
            financingStatus: lead.financingStatus,
            lotStatus: lead.lotStatus,
            qualificationScore: lead.qualificationScore,
            status: lead.status
          }
        );
        
        const updatedLead = updateResult.records[0].get('l').properties;
        return res.json({ 
          success: true, 
          data: updatedLead,
          message: 'Lead updated successfully'
        });
      } else {
        // Create new lead
        const result = await session.run(
          `CREATE (l:Lead {
            id: $id,
            name: $name,
            email: $email,
            phone: $phone,
            state: $state,
            squareFootage: $squareFootage,
            timeline: $timeline,
            financingStatus: $financingStatus,
            lotStatus: $lotStatus,
            qualificationScore: $qualificationScore,
            status: $status,
            createdAt: datetime(),
            updatedAt: datetime()
          }) RETURN l`,
          lead
        );
        
        const createdLead = result.records[0].get('l').properties;
        return res.json({ 
          success: true, 
          data: createdLead,
          message: 'Lead created successfully'
        });
      }
    } catch (error) {
      console.error('Error saving lead to database:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to save lead',
        details: error.message
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error processing lead request:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to process lead request',
      details: error.message
    });
  }
});

app.get('/api/leads', async (req, res) => {
  try {
    if (!isConnected) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected',
        message: 'Cannot retrieve leads without database connection'
      });
    }
    
    const session = driver.session({ database: dbName });
    try {
      const result = await session.run(`
        MATCH (l:Lead)
        OPTIONAL MATCH (l)-[r:HAS_APPOINTMENT]->(a:Appointment)
        WITH l, a
        ORDER BY l.createdAt DESC
        RETURN l, collect(a) as appointments
      `);
      
      const leadsData = result.records.map(record => {
        const lead = record.get('l').properties;
        const appointments = record.get('appointments').map(appt => appt.properties);
        
        // Format dates for frontend
        if (lead.createdAt && typeof lead.createdAt !== 'string') {
          lead.createdAt = lead.createdAt.toString();
        }
        if (lead.updatedAt && typeof lead.updatedAt !== 'string') {
          lead.updatedAt = lead.updatedAt.toString();
        }
        
        // Include appointments with the lead
        return {
          ...lead,
          appointments: appointments.map(a => {
            // Format dates for frontend
            if (a.date && typeof a.date !== 'string') {
              a.date = a.date.toString();
            }
            if (a.createdAt && typeof a.createdAt !== 'string') {
              a.createdAt = a.createdAt.toString();
            }
            if (a.updatedAt && typeof a.updatedAt !== 'string') {
              a.updatedAt = a.updatedAt.toString();
            }
            return a;
          })
        };
      });
      
      return res.json({ success: true, data: leadsData });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error fetching leads:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch leads',
      details: error.message 
    });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    console.log('Received appointment creation request:', req.body);
    const { leadId, date, time, name, email, phone, service } = req.body;
    
    // Check required fields - either leadId OR (name, email, phone) must be provided
    if ((!leadId && (!name || !email || !phone)) || !date || !time) {
      console.error('Missing required fields:', { leadId, name, email, phone, date, time });
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields',
        details: 'Please provide either a leadId or complete contact information (name, email, phone), along with date and time.'
      });
    }

    if (!isConnected) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected',
        message: 'Cannot create appointment without database connection'
      });
    }

    const session = driver.session({ database: dbName });
    try {
      // Check if the appointment slot is available
      const checkResult = await session.run(
        `MATCH (a:Appointment) 
         WHERE date(a.date) = date($date) AND a.time = $time AND a.status = 'scheduled'
         RETURN a`,
        { date, time }
      );
      
      if (checkResult.records.length > 0) {
        return res.status(409).json({ 
          success: false, 
          error: 'Time slot not available',
          message: 'This appointment time has already been booked'
        });
      }
      
      let usedLeadId = leadId;
      let lead = null;
      
      // If no leadId provided, create a new lead or find existing lead by email
      if (!usedLeadId) {
        console.log('No leadId provided, checking for existing lead by email:', email);
        // Check if lead with this email exists
        const findLeadResult = await session.run(
          'MATCH (l:Lead {email: $email}) RETURN l',
          { email }
        );
        
        if (findLeadResult.records.length > 0) {
          lead = findLeadResult.records[0].get('l').properties;
          usedLeadId = lead.id;
          console.log('Found existing lead:', usedLeadId);
        } else {
          // Create a new lead
          const newLeadId = `lead-${uuidv4()}`;
          console.log('Creating new lead:', newLeadId);
          
          const createLeadResult = await session.run(
            `CREATE (l:Lead {
              id: $id,
              name: $name,
              email: $email,
              phone: $phone,
              status: 'New',
              createdAt: datetime(),
              updatedAt: datetime()
            }) RETURN l`,
            { 
              id: newLeadId,
              name,
              email,
              phone
            }
          );
          
          lead = createLeadResult.records[0].get('l').properties;
          usedLeadId = newLeadId;
          console.log('New lead created with ID:', usedLeadId);
        }
      } else {
        // Check if the provided leadId exists
        const leadResult = await session.run(
          'MATCH (l:Lead {id: $leadId}) RETURN l',
          { leadId: usedLeadId }
        );
        
        if (leadResult.records.length === 0) {
          return res.status(404).json({ 
            success: false, 
            error: 'Lead not found',
            message: 'Cannot schedule appointment for non-existent lead'
          });
        }
        
        lead = leadResult.records[0].get('l').properties;
      }
      
      // Find the appointment to update
      const findAppointmentResult = await session.run(
        `MATCH (a:Appointment)
         WHERE date(a.date) = date($date) AND a.time = $time AND a.status = 'available'
         RETURN a`,
        { date, time }
      );
      
      if (findAppointmentResult.records.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Appointment slot not found',
          message: 'The requested appointment time was not found in the system or is not available'
        });
      }
      
      const appointmentId = findAppointmentResult.records[0].get('a').properties.id;
      
      // Update appointment and create relationship
      const result = await session.run(
        `MATCH (l:Lead {id: $leadId})
         MATCH (a:Appointment {id: $appointmentId})
         SET a.status = 'scheduled', 
             a.leadName = l.name,
             a.leadEmail = l.email,
             a.leadPhone = l.phone,
             a.updatedAt = datetime()
         CREATE (l)-[r:HAS_APPOINTMENT {createdAt: datetime()}]->(a)
         RETURN a, l`,
        { leadId: usedLeadId, appointmentId }
      );
      
      if (result.records.length === 0) {
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to update appointment',
          message: 'Could not update appointment status'
        });
      }
      
      const appointment = result.records[0].get('a').properties;
      
      // Send confirmation email
      let emailSent = false;
      try {
        const emailTemplate = getEmailTemplate(lead, {
          date: new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          time: new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
          })
        });
        
        const emailResult = await sendEmail(
          lead.email,
          'Appointment Confirmation',
          emailTemplate.text,
          emailTemplate.html
        );
        
        emailSent = emailResult.success;
        console.log('Email sending result:', emailResult);
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Continue despite email error
      }
      
      return res.json({ 
        success: true, 
        data: { 
          appointment,
          lead
        },
        emailSent,
        message: 'Appointment scheduled successfully'
      });
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to schedule appointment',
        details: error.message
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error processing appointment request:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to process appointment request',
      details: error.message
    });
  }
});

app.get('/api/appointments', async (req, res) => {
  try {
    if (!isConnected) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected',
        message: 'Cannot retrieve appointments without database connection'
      });
    }
    
    // Allow filtering by status
    const status = req.query.status;
    const date = req.query.date;
    
    console.log(`Fetching appointments with filters: status=${status || 'any'}, date=${date || 'any'}`);
    
    const session = driver.session({ database: dbName });
    try {
      let query = `
        MATCH (a:Appointment)
        OPTIONAL MATCH (l:Lead)-[r:HAS_APPOINTMENT]->(a)
      `;
      
      // Add filters if provided
      const params = {};
      if (status) {
        query += ` WHERE a.status = $status`;
        params.status = status;
      }
      
      if (date) {
        if (status) {
          query += ` AND date(a.date) = date($date)`;
        } else {
          query += ` WHERE date(a.date) = date($date)`;
        }
        params.date = date;
      }
      
      query += `
        WITH a, l
        ORDER BY a.date, a.time
        RETURN a, l
      `;
      
      console.log('Executing query:', query);
      const result = await session.run(query, params);
      console.log(`Query returned ${result.records.length} records`);
      
      const appointmentsData = result.records.map(record => {
        const appointment = record.get('a').properties;
        const lead = record.get('l') ? record.get('l').properties : null;
        
        // Format dates for frontend
        if (appointment.date && typeof appointment.date !== 'string') {
          // Format date in a way JavaScript can parse
          const dateObj = appointment.date;
          if (dateObj.year && dateObj.month && dateObj.day) {
            const year = dateObj.year.low || dateObj.year;
            const month = (dateObj.month.low || dateObj.month);  // Neo4j months are 1-based
            const day = dateObj.day.low || dateObj.day;
            appointment.dateFormatted = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          }
          appointment.date = appointment.date.toString();
        } else if (appointment.date && typeof appointment.date === 'string') {
          // If it's already a string, try to extract a date format
          try {
            const date = new Date(appointment.date);
            if (!isNaN(date)) {
              appointment.dateFormatted = date.toISOString().split('T')[0];
            }
          } catch (e) {
            console.warn(`Failed to parse date from string: ${appointment.date}`);
          }
        }
        
        if (appointment.createdAt && typeof appointment.createdAt !== 'string') {
          appointment.createdAt = appointment.createdAt.toString();
        }
        
        if (appointment.updatedAt && typeof appointment.updatedAt !== 'string') {
          appointment.updatedAt = appointment.updatedAt.toString();
        }
        
        // Include lead information if available
        if (lead) {
          if (lead.createdAt && typeof lead.createdAt !== 'string') {
            lead.createdAt = lead.createdAt.toString();
          }
          if (lead.updatedAt && typeof lead.updatedAt !== 'string') {
            lead.updatedAt = lead.updatedAt.toString();
          }
          
          return {
            ...appointment,
            lead
          };
        }
        
        return appointment;
      });
      
      console.log(`Returning ${appointmentsData.length} appointments with status ${status || 'any'}`);
      return res.json({ success: true, data: appointmentsData });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch appointments',
      details: error.message 
    });
  }
});

app.get('/api/leads/:id', async (req, res) => {
  try {
    if (!isConnected) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected',
        message: 'Cannot retrieve lead without database connection'
      });
    }
    
    const session = driver.session({ database: dbName });
    try {
      const result = await session.run(`
        MATCH (l:Lead {id: $id})
        OPTIONAL MATCH (l)-[r:HAS_APPOINTMENT]->(a:Appointment)
        RETURN l, collect(a) as appointments
      `, { id: req.params.id });
      
      if (result.records.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Lead not found',
          message: 'The requested lead does not exist'
        });
      }
      
      const lead = result.records[0].get('l').properties;
      const appointments = result.records[0].get('appointments').map(appt => appt.properties);
      
      // Format dates for frontend
      if (lead.createdAt && typeof lead.createdAt !== 'string') {
        lead.createdAt = lead.createdAt.toString();
      }
      if (lead.updatedAt && typeof lead.updatedAt !== 'string') {
        lead.updatedAt = lead.updatedAt.toString();
      }
      
      return res.json({ 
        success: true, 
        data: {
          ...lead,
          appointments: appointments.map(a => {
            // Format dates for frontend
            if (a.date && typeof a.date !== 'string') {
              a.date = a.date.toString();
            }
            if (a.createdAt && typeof a.createdAt !== 'string') {
              a.createdAt = a.createdAt.toString();
            }
            if (a.updatedAt && typeof a.updatedAt !== 'string') {
              a.updatedAt = a.updatedAt.toString();
            }
            return a;
          })
        }
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error fetching lead:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch lead',
      details: error.message 
    });
  }
});

app.get('/api/appointments/:id', async (req, res) => {
  try {
    if (!isConnected) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected',
        message: 'Cannot retrieve appointment without database connection'
      });
    }
    
    const session = driver.session({ database: dbName });
    try {
      const result = await session.run(`
        MATCH (a:Appointment {id: $id})
        OPTIONAL MATCH (l:Lead)-[r:HAS_APPOINTMENT]->(a)
        RETURN a, l
      `, { id: req.params.id });
      
      if (result.records.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Appointment not found',
          message: 'The requested appointment does not exist'
        });
      }
      
      const appointment = result.records[0].get('a').properties;
      const lead = result.records[0].get('l') ? result.records[0].get('l').properties : null;
      
      // Format dates for frontend
      if (appointment.date && typeof appointment.date !== 'string') {
        const dateObj = appointment.date;
        if (dateObj.year && dateObj.month && dateObj.day) {
          const year = dateObj.year.low || dateObj.year;
          const month = (dateObj.month.low || dateObj.month);
          const day = dateObj.day.low || dateObj.day;
          appointment.dateFormatted = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        }
        appointment.date = appointment.date.toString();
      }
      
      if (appointment.createdAt && typeof appointment.createdAt !== 'string') {
        appointment.createdAt = appointment.createdAt.toString();
      }
      
      if (appointment.updatedAt && typeof appointment.updatedAt !== 'string') {
        appointment.updatedAt = appointment.updatedAt.toString();
      }
      
      // Include lead information if available
      if (lead) {
        if (lead.createdAt && typeof lead.createdAt !== 'string') {
          lead.createdAt = lead.createdAt.toString();
        }
        if (lead.updatedAt && typeof lead.updatedAt !== 'string') {
          lead.updatedAt = lead.updatedAt.toString();
        }
        
        return res.json({ 
          success: true, 
          data: {
            ...appointment,
            lead
          }
        });
      }
      
      return res.json({ 
        success: true, 
        data: appointment
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch appointment',
      details: error.message 
    });
  }
});

app.put('/api/appointments/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    if (!isConnected) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected',
        message: 'Cannot update appointment without database connection'
      });
    }
    
    const session = driver.session({ database: dbName });
    try {
      // Update appointment properties
      const result = await session.run(`
        MATCH (a:Appointment {id: $id})
        SET a.status = $status,
            a.notes = $notes,
            a.updatedAt = datetime()
        RETURN a
      `, { 
        id: req.params.id,
        status,
        notes: notes || ''
      });
      
      if (result.records.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Appointment not found',
          message: 'The requested appointment does not exist'
        });
      }
      
      const appointment = result.records[0].get('a').properties;
      
      // Format dates for frontend
      if (appointment.date && typeof appointment.date !== 'string') {
        appointment.date = appointment.date.toString();
      }
      if (appointment.createdAt && typeof appointment.createdAt !== 'string') {
        appointment.createdAt = appointment.createdAt.toString();
      }
      if (appointment.updatedAt && typeof appointment.updatedAt !== 'string') {
        appointment.updatedAt = appointment.updatedAt.toString();
      }
      
      return res.json({ 
        success: true, 
        data: appointment,
        message: 'Appointment updated successfully'
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error updating appointment:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to update appointment',
      details: error.message 
    });
  }
});

app.get('/api/leads/:email/appointment', async (req, res) => {
  try {
    if (!isConnected) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected',
        message: 'Cannot check appointment without database connection'
      });
    }
    
    const email = req.params.email;
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing email parameter',
        message: 'Email address is required'
      });
    }
    
    const session = driver.session({ database: dbName });
    try {
      const result = await session.run(`
        MATCH (l:Lead {email: $email})
        OPTIONAL MATCH (l)-[r:HAS_APPOINTMENT]->(a:Appointment)
        RETURN l, a
      `, { email });
      
      if (result.records.length === 0) {
        return res.json({ 
          success: true, 
          hasAppointment: false,
          message: 'No lead found with this email address'
        });
      }
      
      const lead = result.records[0].get('l').properties;
      const appointment = result.records[0].get('a');
      
      if (!appointment) {
        return res.json({ 
          success: true, 
          hasAppointment: false,
          lead
        });
      }
      
      // Format appointment for response
      const appointmentData = appointment.properties;
      if (appointmentData.date && typeof appointmentData.date !== 'string') {
        appointmentData.date = appointmentData.date.toString();
      }
      if (appointmentData.createdAt && typeof appointmentData.createdAt !== 'string') {
        appointmentData.createdAt = appointmentData.createdAt.toString();
      }
      if (appointmentData.updatedAt && typeof appointmentData.updatedAt !== 'string') {
        appointmentData.updatedAt = appointmentData.updatedAt.toString();
      }
      
      return res.json({ 
        success: true, 
        hasAppointment: true,
        lead,
        appointment: appointmentData
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error checking appointment:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to check appointment',
      details: error.message 
    });
  }
});

// Add an endpoint to get available appointments
app.get('/api/available-appointments', async (req, res) => {
  try {
    if (!isConnected) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected',
        message: 'Cannot retrieve available appointments without database connection'
      });
    }
    
    // Query parameters
    const { startDate, endDate } = req.query;
    
    if (!startDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing start date',
        message: 'Start date is required'
      });
    }
    
    const session = driver.session({ database: dbName });
    try {
      let query = `
        MATCH (a:Appointment)
        WHERE a.status = 'available'
        AND date(a.date) >= date($startDate)
      `;
      
      const params = { startDate };
      
      if (endDate) {
        query += ` AND date(a.date) <= date($endDate)`;
        params.endDate = endDate;
      } else {
        // Default to next 30 days if no end date provided
        const thirtyDaysLater = new Date(new Date(startDate).getTime() + 30 * 24 * 60 * 60 * 1000);
        const endDateStr = thirtyDaysLater.toISOString().split('T')[0];
        query += ` AND date(a.date) <= date($endDate)`;
        params.endDate = endDateStr;
      }
      
      query += ` RETURN a ORDER BY a.date, a.time`;
      
      const result = await session.run(query, params);
      
      const availableAppointments = result.records.map(record => {
        const appointment = record.get('a').properties;
        
        // Format dates for frontend
        if (appointment.date && typeof appointment.date !== 'string') {
          const dateObj = appointment.date;
          if (dateObj.year && dateObj.month && dateObj.day) {
            const year = dateObj.year.low || dateObj.year;
            const month = (dateObj.month.low || dateObj.month);
            const day = dateObj.day.low || dateObj.day;
            appointment.dateFormatted = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          }
          appointment.date = appointment.date.toString();
        }
        
        return appointment;
      });
      
      return res.json({ 
        success: true, 
        data: availableAppointments
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error fetching available appointments:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch available appointments',
      details: error.message 
    });
  }
});

// Serve static files from the React app AFTER API routes
app.use(express.static(path.join(__dirname, 'build')));

// The "catchall" handler for React routing AFTER API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (driver) {
    await driver.close();
  }
  process.exit(0);
}); 