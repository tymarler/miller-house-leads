const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const app = express();
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { driver, config, testConnection, executeQuery } = require('./src/config/database');
const leadsData = require('./src/data/leads');
const appointmentsData = require('./src/data/appointments');
const dbName = config.database;
let isConnected = false;
let connectionError = null;

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

// Initialize the application with better error handling
async function initializeApp() {
  try {
    console.log('Starting application initialization...');
    const connected = await testConnection(driver);
    if (!connected) {
      throw new Error('Failed to connect to Neo4j database');
    }
    isConnected = true;
    console.log('Database connection successful');
    
    // Initialize database schema and data
    console.log('Setting up database schema...');
    await executeQuery(driver, async (session) => {
      // Create constraints and indexes for Lead nodes
      await session.run(`
        CREATE CONSTRAINT IF NOT EXISTS FOR (l:Lead) REQUIRE l.id IS UNIQUE
      `);
      await session.run(`
        CREATE INDEX IF NOT EXISTS FOR (l:Lead) ON (l.email)
      `);
      
      // Create constraints and indexes for Appointment nodes
      await session.run(`
        CREATE CONSTRAINT IF NOT EXISTS FOR (a:Appointment) REQUIRE a.id IS UNIQUE
      `);
      await session.run(`
        CREATE INDEX IF NOT EXISTS FOR (a:Appointment) ON (a.date, a.time)
      `);
      await session.run(`
        CREATE INDEX IF NOT EXISTS FOR (a:Appointment) ON (a.status)
      `);
    });
    console.log('Database initialization complete');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (accessible at http://localhost:${PORT})`);
    });
  } catch (error) {
    console.error('Error during initialization:', error);
    isConnected = false;
    connectionError = error;
    // Initialize mock data as fallback
    initializeMockLeads();
    initializeMockAppointments();
  }
}

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'build')));

// Define all API routes BEFORE serving static files

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

const getEmailTemplate = (leadData, appointmentDetails) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c5282;">Thank you for scheduling your consultation!</h2>
      
      <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #2d3748;">Your Appointment Details:</h3>
        <p><strong>Date:</strong> ${appointmentDetails.datetime}</p>
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
    Date: ${appointmentDetails.datetime}

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

// Helper function to handle database operations without fallback
async function executeWithSession(operation) {
  const session = driver.session({ database: config.database });
  try {
    return await operation(session);
  } catch (error) {
    console.error('Database operation failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  } finally {
    await session.close();
  }
}

// Initialize appointments in Neo4j
async function initializeAppointments() {
  if (!isConnected) {
    console.error('Cannot initialize appointments: Database not connected');
    return;
  }
    
  const session = driver.session({ database: dbName });
  try {
    // Create appointments for the next 14 days
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    
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
        
        // Store datetime in UTC
        await session.run(`
          CREATE (a:Appointment {
            id: $id,
            datetime: datetime($datetime),
            status: 'available',
            createdAt: datetime(),
            timestamp: $timestamp
          })
        `, {
          id: appointmentId,
          datetime: appointmentDateTime.toISOString(),
          timestamp: appointmentDateTime.getTime()
        });
      }
    }
    
    console.log('Appointments initialized successfully');
  } catch (error) {
    console.error('Error initializing appointments:', error);
  } finally {
    await session.close();
  }
}

// Add this new function to create salesman appointments
async function initializeSalesmanAppointments() {
  console.log('Checking salesman appointments...');
  const session = driver.session({ database: dbName });
  
  try {
    // First check if any appointments are not linked to salesmen
    const unlinkedResult = await session.run(`
      MATCH (a:Appointment)
      WHERE NOT EXISTS { (s:Salesman)-[:OFFERS_APPOINTMENT]->(a) }
      RETURN count(a) as count
    `);
    
    const unlinkedCount = unlinkedResult.records[0].get('count').low;
    console.log(`Found ${unlinkedCount} appointments not linked to salesmen`);
    
    if (unlinkedCount > 0) {
      // Get all salesmen ordered by priority
      const salesmenResult = await session.run(`
        MATCH (s:Salesman)
        WHERE s.status = 'active'
        RETURN s
        ORDER BY s.priority
      `);
      
      if (salesmenResult.records.length === 0) {
        // Create default salesman if none exist
        const defaultSalesmanId = uuidv4();
        await session.run(`
          CREATE (s:Salesman {
            id: $id,
            name: 'Jay',
            email: 'jay@millerhouse.com',
            phone: '555-123-4567',
            priority: 1,
            status: 'active',
            createdAt: datetime()
          })
          RETURN s
        `, { id: defaultSalesmanId });
        
        console.log('Created default salesman Jay');
      }
      
      // Link all unassigned appointments to Jay
      await session.run(`
        MATCH (a:Appointment)
        WHERE NOT EXISTS { (s:Salesman)-[:OFFERS_APPOINTMENT]->(a) }
        WITH a
        MATCH (s:Salesman {name: 'Jay'})
        MERGE (s)-[r:OFFERS_APPOINTMENT {createdAt: datetime()}]->(a)
        RETURN count(r) as relationshipsCreated
      `);
      
      console.log('Assigned all unlinked appointments to Jay');
    } else {
      console.log('All appointments are already linked to salesmen');
    }
  } finally {
    await session.close();
  }
}

// Add this new function to clean up past appointments
async function cleanupPastAppointments() {
  console.log('Cleaning up past appointments...');
  const session = driver.session({ database: dbName });
  try {
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    console.log('Current time:', now.toISOString());
    console.log('Two hours from now:', twoHoursFromNow.toISOString());

    // First, get all appointments that are in the past
    const result = await session.run(`
      MATCH (a:Appointment)
      WHERE datetime(a.datetime) < datetime($minDateTime)
      RETURN a
    `, {
      minDateTime: twoHoursFromNow.toISOString()
    });

    const appointmentsToDelete = result.records.map(record => record.get('a').properties);
    console.log(`Found ${appointmentsToDelete.length} appointments to delete`);

    // Delete each past appointment
    for (const appointment of appointmentsToDelete) {
      await session.run(`
        MATCH (a:Appointment {id: $id})
        DETACH DELETE a
      `, { id: appointment.id });
    }

    console.log(`Cleaned up ${appointmentsToDelete.length} past appointments`);
  } catch (error) {
    console.error('Error cleaning up past appointments:', error);
  } finally {
    await session.close();
  }
}

// Function to clean up duplicate salesmen
async function cleanupSalesmen() {
  console.log('Cleaning up salesmen...');
  const session = driver.session({ database: dbName });
  
  try {
    // First, delete all salesmen
    await session.run(`
      MATCH (s:Salesman)
      DETACH DELETE s
    `);
    
    // Create a single Jay entry
    await session.run(`
      CREATE (s:Salesman {
        id: $id,
        name: 'Jay',
        email: 'jay@millerhouse.com',
        phone: '555-123-4567',
        priority: 1,
        status: 'active',
        createdAt: datetime()
      })
    `, { id: uuidv4() });
    
    console.log('Salesmen cleanup complete - only Jay remains');
  } catch (error) {
    console.error('Error cleaning up salesmen:', error);
  } finally {
    await session.close();
  }
}

// API routes go here (after middleware but before the catch-all route)

// API endpoint for fetching leads
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
        RETURN l
        ORDER BY l.createdAt DESC
      `);
      
      const leads = result.records.map(record => {
        const lead = record.get('l').properties;
        
        // Format dates for frontend
        if (lead.createdAt && typeof lead.createdAt !== 'string') {
          lead.createdAt = lead.createdAt.toString();
        }
        
        return lead;
      });
      
      return res.json({ 
        success: true, 
        data: leads
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error fetching leads:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch leads',
      message: error.message
    });
  }
});

// API endpoint for updating a lead
app.put('/api/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, state, squareFootage, financingStatus, qualificationScore, status } = req.body;
    
    if (!name || !email || !phone) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields',
        details: 'Name, email, and phone are required'
      });
    }
    
    if (!isConnected) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected',
        message: 'Cannot update lead without database connection'
      });
    }
    
    const session = driver.session({ database: dbName });
    try {
      // Check if lead exists
      const checkResult = await session.run(
        'MATCH (l:Lead {id: $id}) RETURN l',
        { id }
      );
      
      if (checkResult.records.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Lead not found',
          message: 'No lead found with the provided ID'
        });
      }
      
      // Check if another lead with this email already exists
      const emailCheckResult = await session.run(
        'MATCH (l:Lead {email: $email}) WHERE l.id <> $id RETURN l',
        { email, id }
      );
      
      if (emailCheckResult.records.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Email already in use',
          message: 'Another lead with this email already exists'
        });
      }
      
      // Update the lead
      const result = await session.run(`
        MATCH (l:Lead {id: $id})
        SET l.name = $name, 
            l.email = $email, 
            l.phone = $phone, 
            l.state = $state,
            l.squareFootage = $squareFootage,
            l.financingStatus = $financingStatus,
            l.qualificationScore = $qualificationScore,
            l.status = $status,
            l.updatedAt = datetime()
        RETURN l
      `, { 
        id,
        name,
        email,
        phone,
        state: state || '',
        squareFootage: squareFootage || 0,
        financingStatus: financingStatus || '',
        qualificationScore: qualificationScore || 0,
        status: status || 'new'
      });
      
      const updatedLead = result.records[0].get('l').properties;
      
      // Format dates for frontend
      if (updatedLead.createdAt && typeof updatedLead.createdAt !== 'string') {
        updatedLead.createdAt = updatedLead.createdAt.toString();
      }
      
      if (updatedLead.updatedAt && typeof updatedLead.updatedAt !== 'string') {
        updatedLead.updatedAt = updatedLead.updatedAt.toString();
      }
      
      // Convert Neo4j integers to JavaScript numbers
      if (updatedLead.squareFootage && typeof updatedLead.squareFootage === 'object' && 'low' in updatedLead.squareFootage) {
        updatedLead.squareFootage = updatedLead.squareFootage.low;
      }
      
      if (updatedLead.qualificationScore && typeof updatedLead.qualificationScore === 'object' && 'low' in updatedLead.qualificationScore) {
        updatedLead.qualificationScore = updatedLead.qualificationScore.low;
      }
      
      return res.json({ 
        success: true, 
        data: updatedLead,
        message: 'Lead updated successfully'
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error updating lead:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to update lead',
      details: error.message
    });
  }
});

// API endpoint for deleting a lead
app.delete('/api/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isConnected) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected',
        message: 'Cannot delete lead without database connection'
      });
    }
    
    const session = driver.session({ database: dbName });
    try {
      // Check if lead exists
      const checkResult = await session.run(
        'MATCH (l:Lead {id: $id}) RETURN l',
        { id }
      );
      
      if (checkResult.records.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Lead not found',
          message: 'No lead found with the provided ID'
        });
      }
      
      // Check if lead has appointments
      const appointmentsResult = await session.run(`
        MATCH (l:Lead {id: $id})-[r:HAS_APPOINTMENT]->(a:Appointment)
        RETURN count(a) as count
      `, { id });
      
      const appointmentCount = appointmentsResult.records[0].get('count').low;
      
      if (appointmentCount > 0) {
        // Delete appointment relationships first
        await session.run(`
          MATCH (l:Lead {id: $id})-[r:HAS_APPOINTMENT]->(a:Appointment)
          SET a.status = 'available'
          DELETE r
        `, { id });
      }
      
      // Delete the lead
      const result = await session.run(`
        MATCH (l:Lead {id: $id})
        DELETE l
        RETURN count(l) as deleted
      `, { id });
      
      const deletedCount = result.records[0].get('deleted').low;
      
      if (deletedCount === 0) {
        return res.status(404).json({
          success: false,
          error: 'Deletion failed',
          message: 'The lead could not be deleted'
        });
      }
      
      return res.json({ 
        success: true, 
        message: 'Lead deleted successfully'
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error deleting lead:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to delete lead',
      details: error.message
    });
  }
});

// API endpoint for creating leads
app.post('/api/leads', async (req, res) => {
  try {
    const { name, email, phone, state, squareFootage, financingStatus, qualificationScore } = req.body;
    
    if (!name || !email || !phone) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields',
        details: 'Name, email, and phone are required'
      });
    }
    
    if (!isConnected) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected',
        message: 'Cannot create lead without database connection'
      });
    }
    
    const session = driver.session({ database: dbName });
    try {
      // Check if lead with this email already exists
      const checkResult = await session.run(
        'MATCH (l:Lead {email: $email}) RETURN l',
        { email }
      );
      
      if (checkResult.records.length > 0) {
        const existingLead = checkResult.records[0].get('l').properties;
        return res.json({
          success: true,
          data: existingLead,
          message: 'Lead with this email already exists',
          existing: true
        });
      }
      
      // Create new lead
      const leadId = uuidv4();
      const result = await session.run(`
        MERGE (l:Lead {email: $email})
        ON CREATE SET l += {
          id: $id,
          name: $name,
          phone: $phone,
          service: $service,
          createdAt: datetime()
        }
        ON MATCH SET l += {
          name: $name,
          phone: $phone,
          service: $service,
          updatedAt: datetime()
        }
        RETURN l
      `, { 
        id: leadId,
        name,
        email,
        phone,
        service
      });
      
      const newLead = result.records[0].get('l').properties;
      
      // Format dates for frontend
      if (newLead.createdAt && typeof newLead.createdAt !== 'string') {
        newLead.createdAt = newLead.createdAt.toString();
      }
      
      return res.json({ 
        success: true, 
        data: newLead,
        message: 'Lead created successfully'
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error creating lead:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to create lead',
      details: error.message
    });
  }
});

// Add API endpoints for managing salesmen
app.get('/api/salesmen', async (req, res) => {
  try {
    if (!isConnected) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected',
        message: 'Cannot retrieve salesmen without database connection'
      });
    }
    
    const session = driver.session({ database: dbName });
    try {
      const result = await session.run(`
        MATCH (s:Salesman)
        RETURN s
        ORDER BY s.priority
      `);
      
      const salesmen = result.records.map(record => {
        const salesman = record.get('s').properties;
        
        // Format dates for frontend
        if (salesman.createdAt && typeof salesman.createdAt !== 'string') {
          salesman.createdAt = salesman.createdAt.toString();
        }
        
        // Convert Neo4j integers to JavaScript numbers
        if (salesman.priority && typeof salesman.priority === 'object' && 'low' in salesman.priority) {
          salesman.priority = salesman.priority.low;
        }
        
        return salesman;
      });
      
      return res.json({ 
        success: true, 
        data: salesmen
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error fetching salesmen:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch salesmen',
      message: error.message
    });
  }
});

// Add API endpoint for updating a salesman
app.put('/api/salesmen/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, priority, status } = req.body;
    
    if (!name || !email || !phone) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields',
        details: 'Name, email, and phone are required'
      });
    }
    
    if (!isConnected) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected',
        message: 'Cannot update salesman without database connection'
      });
    }
    
    const session = driver.session({ database: dbName });
    try {
      // Check if salesman exists
      const checkResult = await session.run(
        'MATCH (s:Salesman {id: $id}) RETURN s',
        { id }
      );
      
      if (checkResult.records.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Salesman not found',
          message: 'No salesman found with the provided ID'
        });
      }
      
      // Check if another salesman with this email already exists
      const emailCheckResult = await session.run(
        'MATCH (s:Salesman {email: $email}) WHERE s.id <> $id RETURN s',
        { email, id }
      );
      
      if (emailCheckResult.records.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Email already in use',
          message: 'Another salesman with this email already exists'
        });
      }
      
      // Update the salesman
      const result = await session.run(`
        MATCH (s:Salesman {id: $id})
        SET s.name = $name, 
            s.email = $email, 
            s.phone = $phone, 
            s.priority = $priority,
            s.status = $status,
            s.updatedAt = datetime()
        RETURN s
      `, { 
        id,
        name,
        email,
        phone,
        priority: priority || 999,
        status: status || 'active'
      });
      
      const updatedSalesman = result.records[0].get('s').properties;
      
      // Format dates for frontend
      if (updatedSalesman.createdAt && typeof updatedSalesman.createdAt !== 'string') {
        updatedSalesman.createdAt = updatedSalesman.createdAt.toString();
      }
      
      if (updatedSalesman.updatedAt && typeof updatedSalesman.updatedAt !== 'string') {
        updatedSalesman.updatedAt = updatedSalesman.updatedAt.toString();
      }
      
      // Convert Neo4j integers to JavaScript numbers
      if (updatedSalesman.priority && typeof updatedSalesman.priority === 'object' && 'low' in updatedSalesman.priority) {
        updatedSalesman.priority = updatedSalesman.priority.low;
      }
      
      return res.json({ 
        success: true, 
        data: updatedSalesman,
        message: 'Salesman updated successfully'
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error updating salesman:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to update salesman',
      details: error.message
    });
  }
});

// Add API endpoint for deleting a salesman
app.delete('/api/salesmen/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isConnected) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected',
        message: 'Cannot delete salesman without database connection'
      });
    }
    
    const session = driver.session({ database: dbName });
    try {
      // Check if salesman exists
      const checkResult = await session.run(
        'MATCH (s:Salesman {id: $id}) RETURN s',
        { id }
      );
      
      if (checkResult.records.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Salesman not found',
          message: 'No salesman found with the provided ID'
        });
      }
      
      // Check if salesman has appointments
      const appointmentsResult = await session.run(`
        MATCH (s:Salesman {id: $id})-[r:OFFERS_APPOINTMENT]->(a:Appointment)
        RETURN count(a) as count
      `, { id });
      
      const appointmentCount = appointmentsResult.records[0].get('count').low;
      
      if (appointmentCount > 0) {
        // Option 1: Prevent deletion if salesman has appointments
        return res.status(409).json({
          success: false,
          error: 'Salesman has appointments',
          message: `This salesman has ${appointmentCount} appointments and cannot be deleted. Remove or reassign the appointments first.`
        });
        
        // Option 2: Delete relationships first (uncomment to use this approach instead)
        /*
        await session.run(`
          MATCH (s:Salesman {id: $id})-[r:OFFERS_APPOINTMENT]->()
          DELETE r
        `, { id });
        */
      }
      
      // Delete the salesman
      const result = await session.run(`
        MATCH (s:Salesman {id: $id})
        DELETE s
        RETURN count(s) as deleted
      `, { id });
      
      const deletedCount = result.records[0].get('deleted').low;
      
      if (deletedCount === 0) {
        return res.status(404).json({
          success: false,
          error: 'Deletion failed',
          message: 'The salesman could not be deleted'
        });
      }
      
      return res.json({ 
        success: true, 
        message: 'Salesman deleted successfully'
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error deleting salesman:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to delete salesman',
      details: error.message
    });
  }
});

app.post('/api/salesmen', async (req, res) => {
  try {
    const { name, email, phone, priority } = req.body;
    
    if (!name || !email || !phone) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields',
        details: 'Name, email, and phone are required'
      });
    }
    
    if (!isConnected) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected',
        message: 'Cannot create salesman without database connection'
      });
    }
    
    const session = driver.session({ database: dbName });
    try {
      // Check if salesman with this email already exists
      const checkResult = await session.run(
        'MATCH (s:Salesman {email: $email}) RETURN s',
        { email }
      );
      
      if (checkResult.records.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Salesman already exists',
          message: 'A salesman with this email already exists'
        });
      }
      
      // Create new salesman
      const salesmanId = uuidv4();
      const result = await session.run(`
        CREATE (s:Salesman {
          id: $id,
          name: $name,
          email: $email,
          phone: $phone,
          priority: $priority,
          status: 'active',
          createdAt: datetime()
        })
        RETURN s
      `, { 
        id: salesmanId,
        name,
        email,
        phone,
        priority: priority || 999 // Default to lowest priority if not specified
      });
      
      const newSalesman = result.records[0].get('s').properties;
      
      // Format dates for frontend
      if (newSalesman.createdAt && typeof newSalesman.createdAt !== 'string') {
        newSalesman.createdAt = newSalesman.createdAt.toString();
      }
      
      return res.json({ 
        success: true, 
        data: newSalesman,
        message: 'Salesman created successfully'
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error creating salesman:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to create salesman',
      details: error.message
    });
  }
});

// API endpoint for updating salesman availability
app.post('/api/salesmen/:id/availability', async (req, res) => {
  try {
    const { datetime, timeSlots } = req.body;
    
    if (!datetime || !timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields',
        message: 'Datetime and timeSlots array are required'
      });
    }
    
    const session = driver.session({ database: dbName });
    try {
      for (const timeSlot of timeSlots) {
        const appointmentDateTime = new Date(`${datetime}T${timeSlot}`);
        
        // Check if appointment already exists
        const checkResult = await session.run(`
          MATCH (a:Appointment)
          WHERE datetime(a.datetime) = datetime($datetime)
          RETURN a
        `, { datetime: appointmentDateTime.toISOString() });
        
        if (checkResult.records.length === 0) {
          // Create new appointment
          await session.run(`
            CREATE (a:Appointment {
              id: $id,
              datetime: datetime($datetime),
              status: 'available',
              createdAt: datetime()
            })
            WITH a
            MATCH (s:Salesman {id: $salesmanId})
            MERGE (s)-[r:OFFERS_APPOINTMENT {createdAt: datetime()}]->(a)
          `, {
            id: uuidv4(),
            datetime: appointmentDateTime.toISOString(),
            salesmanId: req.params.id
          });
        } else {
          // Appointment exists, just link it to the salesman if not already linked
          await session.run(`
            MATCH (a:Appointment)
            WHERE datetime(a.datetime) = datetime($datetime)
            MATCH (s:Salesman {id: $salesmanId})
            MERGE (s)-[r:OFFERS_APPOINTMENT {createdAt: datetime()}]->(a)
          `, {
            datetime: appointmentDateTime.toISOString(),
            salesmanId: req.params.id
          });
        }
      }
      
      res.json({ success: true });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update availability',
      details: error.message
    });
  }
});

// Add API endpoints for appointments

// API endpoint for getting appointments
app.get('/api/appointments', async (req, res) => {
  try {
    const { status } = req.query;
    
    const session = driver.session({ database: dbName });
    try {
      const query = `
        MATCH (a:Appointment)
        OPTIONAL MATCH (l:Lead)-[:HAS_APPOINTMENT]->(a)
        OPTIONAL MATCH (s:Salesman)-[:OFFERS_APPOINTMENT]->(a)
        ${status ? 'WHERE a.status = $status' : ''}
        RETURN a, l, s
        ORDER BY a.datetime
      `;
      
      const result = await session.run(query, status ? { status } : {});
      
      const appointments = result.records.map(record => {
        const appointment = record.get('a').properties;
        const lead = record.get('l')?.properties || null;
        const salesman = record.get('s')?.properties || null;
        
        // Format datetime for frontend
        if (appointment.datetime && typeof appointment.datetime !== 'string') {
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
        
        // Add lead info if available
        if (lead) {
          appointment.lead = lead;
          appointment.leadId = lead.id;
        }
        
        // Add salesman info if available
        if (salesman) {
          appointment.salesman = salesman;
          appointment.salesmanId = salesman.id;
        }
        
        return appointment;
      });
      
      console.log(`Returning ${appointments.length} appointments with status ${status || 'any'}`);
      
      return res.json({ 
        success: true, 
        data: appointments
      });
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

// API endpoint for creating a new appointment
app.post('/api/appointments', async (req, res) => {
  try {
    const { datetime, name, email, phone, service } = req.body;
    
    console.log('Received request body:', req.body);
    
    if (!datetime || !name || !email || !phone || !service) {
      console.log('Missing required fields:', { datetime, name, email, phone, service });
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields',
        details: 'All fields (datetime, name, email, phone, service) are required'
      });
    }
    
    // Validate datetime
    const appointmentDateTime = new Date(datetime);
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    console.log('Server-side datetime processing:', {
      receivedDateTime: datetime,
      formattedDateTime: appointmentDateTime,
      currentTime: now,
      twoHoursFromNow: twoHoursFromNow
    });
    
    if (appointmentDateTime < twoHoursFromNow) {
      console.log('Appointment time validation failed:', {
        appointmentDateTime,
        twoHoursFromNow,
        difference: twoHoursFromNow - appointmentDateTime
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid appointment time',
        details: 'Appointments must be scheduled at least 2 hours in advance'
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
      // Find the appointment with proper status check
      const appointmentQuery = `
        MATCH (a:Appointment)
        WHERE datetime(a.datetime) = datetime($datetime) 
        AND a.status = 'available'
        AND NOT EXISTS((:Lead)-[:HAS_APPOINTMENT]->(a))
        RETURN a
        LIMIT 1`;
      
      const appointmentResult = await session.run(appointmentQuery, { 
        datetime: appointmentDateTime.toISOString()
      });
      
      if (appointmentResult.records.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Appointment not available',
          message: 'This appointment slot is no longer available. Please select another time.'
        });
      }
      
      const appointmentId = appointmentResult.records[0].get('a').properties.id;
      
      // Create or update lead
      const leadId = uuidv4();
      await session.run(`
        MERGE (l:Lead {email: $email})
        ON CREATE SET l += {
          id: $id,
          name: $name,
          phone: $phone,
          service: $service,
          createdAt: datetime()
        }
        ON MATCH SET l += {
          name: $name,
          phone: $phone,
          service: $service,
          updatedAt: datetime()
        }
        RETURN l
      `, {
        id: leadId,
        name,
        email,
        phone,
        service
      });
      
      // Update appointment status and link to lead
      await session.run(`
        MATCH (a:Appointment {id: $appointmentId})
        MATCH (l:Lead {email: $email})
        SET a.status = 'booked'
        CREATE (l)-[r:HAS_APPOINTMENT {createdAt: datetime()}]->(a)
        RETURN a, l, r
      `, {
        appointmentId,
        email
      });
      
      return res.json({
        success: true,
        message: 'Appointment booked successfully'
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error creating appointment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create appointment',
      details: error.message
    });
  }
});

// API endpoint for updating an appointment
app.put('/api/appointments/:id', async (req, res) => {
  try {
    const { datetime, status, leadId } = req.body;
    
    if (!datetime || !status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details: 'Datetime and status are required'
      });
    }

    const session = driver.session({ database: dbName });
    try {
      const appointmentDateTime = new Date(datetime);
      
      await session.run(`
          MATCH (a:Appointment {id: $id})
        SET a.datetime = datetime($datetime),
              a.status = $status,
              a.updatedAt = datetime()
        `, { 
        id: req.params.id,
        datetime: appointmentDateTime.toISOString(),
          status
        });
        
      if (leadId) {
        await session.run(`
            MATCH (a:Appointment {id: $id})
            MATCH (l:Lead {id: $leadId})
          MERGE (l)-[r:HAS_APPOINTMENT {createdAt: datetime()}]->(a)
        `, {
          id: req.params.id,
          leadId
        });
      }
      
      const result = await session.run(`
        MATCH (a:Appointment {id: $id})
        RETURN a
      `, { id: req.params.id });
      
      if (result.records.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Appointment not found'
        });
      }
      
      const updatedAppointment = result.records[0].get('a').properties;
      
      // Format datetime for frontend
      if (updatedAppointment.datetime && typeof updatedAppointment.datetime !== 'string') {
        updatedAppointment.datetime = updatedAppointment.datetime.toString();
      }
      
      res.json({
        success: true, 
        data: updatedAppointment
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update appointment',
      details: error.message
    });
  }
});

// API endpoint for deleting an appointment
app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isConnected) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected',
        message: 'Cannot delete appointment without database connection'
      });
    }
    
    const session = driver.session({ database: dbName });
    try {
      // Check if appointment exists
      const checkResult = await session.run(
        'MATCH (a:Appointment {id: $id}) RETURN a',
        { id }
      );
      
      if (checkResult.records.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Appointment not found',
          message: 'No appointment found with the provided ID'
        });
      }
      
      // Begin transaction
      const txc = session.beginTransaction();
      
      try {
        // First, delete any relationships to this appointment
        await txc.run(`
          MATCH (a:Appointment {id: $id})<-[r:HAS_APPOINTMENT]-()
          DELETE r
        `, { id });
        
        // Then delete any relationships from this appointment
        await txc.run(`
          MATCH (a:Appointment {id: $id})-[r]-()
          DELETE r
        `, { id });
        
        // Finally, delete the appointment
        const result = await txc.run(`
          MATCH (a:Appointment {id: $id})
          DELETE a
          RETURN count(a) as deleted
        `, { id });
        
        const deletedCount = result.records[0].get('deleted').low;
        
        await txc.commit();
        
        if (deletedCount === 0) {
          return res.status(404).json({
            success: false,
            error: 'Deletion failed',
            message: 'The appointment could not be deleted'
          });
        }
        
        return res.json({ 
          success: true, 
          message: 'Appointment deleted successfully'
        });
      } catch (error) {
        await txc.rollback();
        throw error;
      }
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to delete appointment',
      details: error.message
    });
  }
});

// Add an endpoint to get appointments for a specific salesman
app.get('/api/salesmen/:id/appointments', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;
    
    if (!isConnected) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected',
        message: 'Cannot retrieve appointments without database connection'
      });
    }
    
    const session = driver.session({ database: dbName });
    try {
      // Check if salesman exists
      const salesmanResult = await session.run(
        'MATCH (s:Salesman {id: $id}) RETURN s',
        { id }
      );
      
      if (salesmanResult.records.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Salesman not found',
          message: 'No salesman found with the provided ID'
        });
      }
      
      // Get appointments for this salesman
      let query = `
        MATCH (s:Salesman {id: $id})-[:OFFERS_APPOINTMENT]->(a:Appointment)
        WHERE datetime(a.datetime) > datetime($minDateTime)
        OPTIONAL MATCH (l:Lead)-[r:HAS_APPOINTMENT]->(a)
        WITH a, l, s
        ORDER BY a.datetime
        RETURN a, l, s
      `;
      
      const params = {
        id,
        minDateTime: new Date().toISOString()
      };
      
      if (status && status !== 'any') {
        query += ' AND a.status = $status';
        params.status = status;
      }
      
      const result = await session.run(query, params);
      
      const appointments = result.records.map(record => {
        const appointment = record.get('a').properties;
        const lead = record.get('l') ? record.get('l').properties : null;
        const salesman = record.get('s').properties;
        
        // Format datetime for frontend
        if (appointment.datetime && typeof appointment.datetime !== 'string') {
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
          }
        }
        
        // Add lead info if available
        if (lead) {
          appointment.lead = lead;
          appointment.leadId = lead.id;
        }
        
        // Add salesman info if available
        if (salesman) {
          appointment.salesman = salesman;
          appointment.salesmanId = salesman.id;
        }
        
        return appointment;
      });
      
      console.log(`Returning ${appointments.length} appointments with status ${status || 'any'}`);
      
      return res.json({ 
        success: true, 
        data: appointments
      });
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', neo4j: isConnected });
});

// Handle React routing, return all requests to React app
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

async function deleteNullDateAppointments() {
  try {
    console.log('Cleaning up null date appointments...');
    const session = driver.session({ database: dbName });
    try {
      // First delete relationships
      const deleteRelationships = await session.run(`
        MATCH (a:Appointment)
        WHERE a.datetime IS NULL
        OPTIONAL MATCH (a)-[r]-()
        DELETE r
        RETURN count(r) as deleted
      `);
      
      const deletedRelationships = deleteRelationships.records[0].get('deleted').low;
      console.log(`Deleted ${deletedRelationships} relationships from null date appointments`);
      
      // Then delete the appointments
      const deleteAppointments = await session.run(`
        MATCH (a:Appointment)
        WHERE a.datetime IS NULL
        DELETE a
        RETURN count(a) as deleted
      `);
      
      const deletedAppointments = deleteAppointments.records[0].get('deleted').low;
      console.log(`Deleted ${deletedAppointments} null date appointments`);
      
      return { deletedRelationships, deletedAppointments };
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error deleting null date appointments:', error);
    throw error;
  }
}

initializeApp(); 