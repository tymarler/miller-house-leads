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

// Initialize storage (minimal for tracking errors only)
const storage = {
  errors: []
};

// Initialize Neo4j driver
const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'MillerHouse123!';
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
    throw error; // Re-throw to halt initialization
  }
}

// Helper function to handle database operations without fallback
async function executeWithSession(operation) {
  if (!isConnected || !driver) {
    throw new Error('Database not connected');
  }

  const session = driver.session({ database: dbName });
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

// Initialize database schema and constraints
async function initializeDatabase() {
  console.log('Setting up database schema...');
  const session = driver.session({ database: dbName });
  try {
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
    
    // Create constraints and indexes for Salesman nodes
    await session.run(`
      CREATE CONSTRAINT IF NOT EXISTS FOR (s:Salesman) REQUIRE s.id IS UNIQUE
    `);
    await session.run(`
      CREATE INDEX IF NOT EXISTS FOR (s:Salesman) ON (s.email)
    `);
    await session.run(`
      CREATE INDEX IF NOT EXISTS FOR (s:Salesman) ON (s.priority)
    `);
    
    // Check if we have existing salesmen, if not create some default ones
    const salesmenResult = await session.run(`
      MATCH (s:Salesman) RETURN count(s) as count
    `);
    
    const salesmenCount = salesmenResult.records[0].get('count').low;
    console.log(`Found ${salesmenCount} existing salesmen in database`);
    
    if (salesmenCount === 0) {
      console.log('Creating default salesmen...');
      // Create default salesmen with different priorities (lower number = higher priority)
      await session.run(`
        CREATE (s:Salesman {
          id: $id1,
          name: 'John Smith',
          email: 'john@millerhouse.com',
          phone: '555-123-4567',
          priority: 1,
          status: 'active',
          createdAt: datetime()
        })
      `, { id1: uuidv4() });
      
      await session.run(`
        CREATE (s:Salesman {
          id: $id2,
          name: 'Sarah Johnson',
          email: 'sarah@millerhouse.com',
          phone: '555-234-5678',
          priority: 2,
          status: 'active',
          createdAt: datetime()
        })
      `, { id2: uuidv4() });
      
      await session.run(`
        CREATE (s:Salesman {
          id: $id3,
          name: 'Michael Brown',
          email: 'michael@millerhouse.com',
          phone: '555-345-6789',
          priority: 3,
          status: 'active',
          createdAt: datetime()
        })
      `, { id3: uuidv4() });
      
      console.log('Default salesmen created');
    }
    
    console.log('Database schema setup complete');
  } finally {
    await session.close();
  }
}

// Initialize appointments in Neo4j
async function initializeAppointments() {
  const session = driver.session({ database: dbName });
  try {
    // First check if appointments already exist
    const existingResult = await session.run(`
      MATCH (a:Appointment)
      RETURN count(a) as count
    `);
    
    const existingCount = existingResult.records[0].get('count').low;
    
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing appointments, skipping initialization`);
      return;
    }
    
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
        console.log('No active salesmen found, skipping appointment assignment');
        return;
      }
      
      // Distribute appointments among salesmen in a round-robin fashion with priority
      console.log('Linking appointments to salesmen based on priority...');
      
      const salesmen = salesmenResult.records.map(record => record.get('s').properties);
      
      // Get unlinked appointments
      const appointmentsResult = await session.run(`
        MATCH (a:Appointment)
        WHERE NOT EXISTS { (s:Salesman)-[:OFFERS_APPOINTMENT]->(a) }
        RETURN a
        ORDER BY a.date, a.time
      `);
      
      const appointments = appointmentsResult.records.map(record => record.get('a').properties);
      
      // Link each appointment to a salesman based on round-robin with priority
      let salesmanIndex = 0;
      for (const appointment of appointments) {
        const salesman = salesmen[salesmanIndex % salesmen.length];
        
        await session.run(`
          MATCH (s:Salesman {id: $salesmanId})
          MATCH (a:Appointment {id: $appointmentId})
          CREATE (s)-[r:OFFERS_APPOINTMENT {createdAt: datetime()}]->(a)
          RETURN s, r, a
        `, { 
          salesmanId: salesman.id, 
          appointmentId: appointment.id 
        });
        
        console.log(`Linked appointment ${appointment.id} to salesman ${salesman.name}`);
        
        salesmanIndex++;
      }
      
      console.log(`Finished linking ${appointments.length} appointments to salesmen`);
    } else {
      console.log('All appointments are already linked to salesmen');
    }
  } finally {
    await session.close();
  }
}

// Initialize the application with better error handling
async function initializeApp() {
  try {
    console.log('Starting application initialization...');
    await initializeDriver();
    
    // Check Neo4j connection
    try {
      await executeWithSession(async (session) => {
        const result = await session.run('RETURN 1');
        console.log('Neo4j connection test successful');
        isConnected = true;
        connectionError = null;
      });
      
      if (isConnected) {
        console.log('Connected to Neo4j, initializing database...');
        await initializeDatabase();
        await executeWithSession(async (session) => {
          const result = await session.run('RETURN 1');
          console.log('Neo4j connection test successful');
          isConnected = true;
          connectionError = null;
        });
        await initializeAppointments();
        await initializeSalesmanAppointments();
        
        // Check for existing leads
        const session = driver.session({ database: dbName });
        try {
          const result = await session.run('MATCH (l:Lead) RETURN count(l) as count');
          const count = result.records[0].get('count').low;
          console.log(`Found ${count} existing leads in database`);
        } finally {
          await session.close();
        }
      } else {
        console.error('Failed to connect to Neo4j');
      }
    } catch (error) {
      console.error('Error during initialization:', error);
      isConnected = false;
    }
  } catch (error) {
    console.error('Critical error during application startup:', error);
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
        CREATE (l:Lead {
          id: $id,
          name: $name,
          email: $email,
          phone: $phone,
          state: $state,
          squareFootage: $squareFootage,
          financingStatus: $financingStatus,
          qualificationScore: $qualificationScore,
          status: 'new',
          createdAt: datetime()
        })
        RETURN l
      `, { 
        id: leadId,
        name,
        email,
        phone,
        state: state || '',
        squareFootage: squareFootage || 0,
        financingStatus: financingStatus || '',
        qualificationScore: qualificationScore || 0
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

// Add API endpoints for managing salesman availability
app.post('/api/salesmen/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, timeSlots } = req.body;
    
    if (!date || !timeSlots || !Array.isArray(timeSlots)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields',
        details: 'Date and timeSlots array are required'
      });
    }
    
    if (!isConnected) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected',
        message: 'Cannot update availability without database connection'
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
      
      // Create or update appointments for each time slot
      const createdAppointments = [];
      
      for (const timeSlot of timeSlots) {
        // Check if appointment already exists for this date/time
        const existingResult = await session.run(`
          MATCH (a:Appointment {date: $date, time: $timeSlot})
          RETURN a
        `, { 
          date,
          timeSlot 
        });
        
        let appointmentId;
        
        if (existingResult.records.length > 0) {
          // Appointment already exists, get its ID
          appointmentId = existingResult.records[0].get('a').properties.id;
          
          // Check if this salesman already offers this appointment
          const relationshipResult = await session.run(`
            MATCH (s:Salesman {id: $salesmanId})-[r:OFFERS_APPOINTMENT]->(a:Appointment {id: $appointmentId})
            RETURN r
          `, { 
            salesmanId: id,
            appointmentId 
          });
          
          if (relationshipResult.records.length === 0) {
            // Create relationship if it doesn't exist
            await session.run(`
              MATCH (s:Salesman {id: $salesmanId})
              MATCH (a:Appointment {id: $appointmentId})
              CREATE (s)-[r:OFFERS_APPOINTMENT {createdAt: datetime()}]->(a)
              RETURN s, r, a
            `, { 
              salesmanId: id,
              appointmentId 
            });
          }
        } else {
          // Create new appointment
          appointmentId = uuidv4();
          
          await session.run(`
            CREATE (a:Appointment {
              id: $id,
              date: $date,
              time: $timeSlot,
              status: 'available',
              createdAt: datetime()
            })
            RETURN a
          `, { 
            id: appointmentId,
            date,
            timeSlot 
          });
          
          // Create relationship between salesman and appointment
          await session.run(`
            MATCH (s:Salesman {id: $salesmanId})
            MATCH (a:Appointment {id: $appointmentId})
            CREATE (s)-[r:OFFERS_APPOINTMENT {createdAt: datetime()}]->(a)
            RETURN s, r, a
          `, { 
            salesmanId: id,
            appointmentId 
          });
        }
        
        createdAppointments.push({
          id: appointmentId,
          date,
          time: timeSlot,
          salesmanId: id
        });
      }
      
      return res.json({ 
        success: true, 
        data: createdAppointments,
        message: 'Salesman availability updated successfully'
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error updating salesman availability:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to update salesman availability',
      details: error.message
    });
  }
});

// Add API endpoints for appointments

// API endpoint for getting appointments
app.get('/api/appointments', async (req, res) => {
  try {
    const { status, date } = req.query;
    console.log(`Fetching appointments with filters: status=${status || 'any'}, date=${date || 'any'}`);
    
    if (!isConnected) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected',
        message: 'Cannot retrieve appointments without database connection'
      });
    }
    
    const session = driver.session({ database: dbName });
    try {
      let query = `
        MATCH (a:Appointment)
        ${status ? 'WHERE a.status = $status' : ''}
        OPTIONAL MATCH (l:Lead)-[r:HAS_APPOINTMENT]->(a)
        OPTIONAL MATCH (s:Salesman)-[:OFFERS_APPOINTMENT]->(a)
        WITH a, l, s
        ORDER BY a.date, a.time
        RETURN a, l, s
      `;
      
      console.log("Executing query:", query, "with params:", status ? { status } : {});
      
      const result = await session.run(query, status ? { status } : {});
      console.log(`Query returned ${result.records.length} records`);
      
      const appointments = result.records.map(record => {
        const appointment = record.get('a').properties;
        const lead = record.get('l') ? record.get('l').properties : null;
        const salesman = record.get('s') ? record.get('s').properties : null;
        
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
      
      console.log(`Returning ${appointments.length} appointments`);
      
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
      message: error.message
    });
  }
});

// API endpoint for updating an appointment
app.put('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time, status, leadId } = req.body;
    
    if (!date || !time || !status) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields',
        details: 'Date, time, and status are required'
      });
    }
    
    if (!isConnected) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected',
        message: 'Cannot update appointment without database connection'
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
      
      let updatedAppointment;
      
      // Begin transaction to ensure all operations succeed or fail together
      const txc = session.beginTransaction();
      
      try {
        // First, check if this appointment was previously booked and remove any existing relationships
        await txc.run(`
          MATCH (a:Appointment {id: $id})<-[r:HAS_APPOINTMENT]-()
          DELETE r
        `, { id });
        
        // Update the appointment
        const updateResult = await txc.run(`
          MATCH (a:Appointment {id: $id})
          SET a.date = date($date), 
              a.time = $time, 
              a.status = $status,
              a.updatedAt = datetime()
          RETURN a
        `, { 
          id,
          date,
          time,
          status
        });
        
        updatedAppointment = updateResult.records[0].get('a').properties;
        
        // If status is 'booked' and a leadId is provided, create a relationship
        if (status === 'booked' && leadId) {
          // Check if lead exists
          const leadCheckResult = await txc.run(
            'MATCH (l:Lead {id: $leadId}) RETURN l',
            { leadId }
          );
          
          if (leadCheckResult.records.length === 0) {
            throw new Error('Lead not found');
          }
          
          // Create relationship between lead and appointment
          await txc.run(`
            MATCH (l:Lead {id: $leadId})
            MATCH (a:Appointment {id: $id})
            CREATE (l)-[r:HAS_APPOINTMENT {createdAt: datetime()}]->(a)
          `, { leadId, id });
          
          // Get lead details to include in response
          const leadResult = await txc.run(`
            MATCH (l:Lead {id: $leadId})
            RETURN l
          `, { leadId });
          
          const lead = leadResult.records[0].get('l').properties;
          updatedAppointment.lead = lead;
          updatedAppointment.leadId = leadId;
        }
        
        // Commit transaction
        await txc.commit();
      } catch (error) {
        // Rollback transaction on error
        await txc.rollback();
        throw error;
      }
      
      // Format dates for frontend
      if (updatedAppointment.date && typeof updatedAppointment.date !== 'string') {
        updatedAppointment.date = updatedAppointment.date.toString();
      }
      
      if (updatedAppointment.createdAt && typeof updatedAppointment.createdAt !== 'string') {
        updatedAppointment.createdAt = updatedAppointment.createdAt.toString();
      }
      
      if (updatedAppointment.updatedAt && typeof updatedAppointment.updatedAt !== 'string') {
        updatedAppointment.updatedAt = updatedAppointment.updatedAt.toString();
      }
      
      return res.json({ 
        success: true, 
        data: updatedAppointment,
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
    
    console.log(`Fetching appointments for salesman ${id} with status filter: ${status || 'any'}`);
    
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
      const salesmanCheck = await session.run(
        'MATCH (s:Salesman {id: $id}) RETURN s',
        { id }
      );
      
      if (salesmanCheck.records.length === 0) {
        console.log(`Salesman ${id} not found`);
        return res.status(404).json({
          success: false,
          error: 'Salesman not found',
          message: 'No salesman found with the provided ID'
        });
      }
      
      let query = `
        MATCH (s:Salesman {id: $id})-[:OFFERS_APPOINTMENT]->(a:Appointment)
        OPTIONAL MATCH (l:Lead)-[r:HAS_APPOINTMENT]->(a)
      `;
      
      // Add status filter if provided
      const params = { id };
      if (status && status !== 'any') {
        query += `WHERE a.status = $status\n`;
        params.status = status;
      }
      
      // Finalize the query
      query += `        WITH a, l
        ORDER BY a.date, a.time
        RETURN a, l`;
      
      console.log("Executing query:", query);
      
      const result = await session.run(query, params);
      console.log(`Query returned ${result.records.length} records for salesman ${id}`);
      
      const appointments = result.records.map(record => {
        const appointment = record.get('a').properties;
        const lead = record.get('l') ? record.get('l').properties : null;
        
        // Format dates for frontend
        if (appointment.date && typeof appointment.date !== 'string') {
          appointment.date = appointment.date.toString();
        }
        
        // Add lead info if available
        if (lead) {
          appointment.lead = lead;
          appointment.leadId = lead.id;
        }
        
        // Add salesman info
        appointment.salesmanId = id;
        
        return appointment;
      });
      
      console.log(`Returning ${appointments.length} appointments for salesman ${id}`);
      
      return res.json({ 
        success: true, 
        data: appointments
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error fetching salesman appointments:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch salesman appointments',
      details: error.message
    });
  }
});

// API endpoint for booking an appointment
app.post('/api/appointments', async (req, res) => {
  try {
    const { date, time, name, email, phone, service } = req.body;
    
    console.log("Received appointment creation request:", JSON.stringify(req.body));
    console.log("Date type:", typeof date);
    console.log("Date value:", date);
    
    if (!date || !time || !name || !email || !phone) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields',
        details: 'Date, time, name, email, and phone are required'
      });
    }
    
    if (!isConnected) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected',
        message: 'Cannot book appointment without database connection'
      });
    }
    
    const session = driver.session({ database: dbName });
    
    try {
      // Check for existing lead with this email
      let leadId = req.body.leadId; // Allow passing leadId directly
      
      if (!leadId) {
        console.log("No leadId provided, checking for existing lead by email:", email);
        
        const leadCheckResult = await session.run(
          'MATCH (l:Lead {email: $email}) RETURN l',
          { email }
        );
        
        if (leadCheckResult.records.length > 0) {
          leadId = leadCheckResult.records[0].get('l').properties.id;
          console.log("Found existing lead:", leadId);
        } else {
          // Create new lead
          leadId = uuidv4();
          console.log("Creating new lead with ID:", leadId);
          
          await session.run(`
            CREATE (l:Lead {
              id: $id,
              name: $name,
              email: $email,
              phone: $phone,
              createdAt: datetime()
            }) RETURN l`,
            { 
              id: leadId,
              name,
              email,
              phone
            }
          );
        }
      }
      
      // Format the date properly regardless of whether it's a string or Neo4j object
      let formattedDate;
      
      try {
        console.log("Processing date:", date);
        
        if (typeof date === 'string') {
          // If it's already a string, we just use it directly
          formattedDate = date;
          console.log("String date received:", formattedDate);
        } else if (typeof date === 'object' && date !== null) {
          console.log("Date is an object with properties:", Object.keys(date));
          
          if (date.year) {
            // If it's a Neo4j datetime object, extract the components and format as YYYY-MM-DD
            console.log("Neo4j date object received:", JSON.stringify(date));
            
            const year = date.year.low || date.year;
            const month = (date.month.low || date.month); // Neo4j months are 1-indexed
            const day = date.day.low || date.day;
            
            // Format as YYYY-MM-DD (ensure month and day are padded with leading zeros if needed)
            formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            console.log("Converted date:", formattedDate);
          } else {
            // Handle other object types like JS Date objects
            console.log("Date appears to be a JS Date or other object:", date);
            formattedDate = new Date(date).toISOString().split('T')[0];
            console.log("Converted to:", formattedDate);
          }
        } else {
          console.error("Invalid date format received:", date);
          return res.status(400).json({
            success: false,
            error: 'Invalid date format',
            details: 'Date must be provided in YYYY-MM-DD format or as a valid date object'
          });
        }
      } catch (error) {
        console.error("Error processing date:", error);
        return res.status(400).json({
          success: false,
          error: 'Error processing date',
          details: error.message
        });
      }
      
      // Find the appointment - ensure we're using a string not an object for the query
      // This ensures we won't get 'date.includes is not a function' errors
      console.log("Searching for appointment with date:", formattedDate, "time:", time);
      
      if (typeof formattedDate !== 'string') {
        console.error("Formatted date is not a string:", formattedDate);
        return res.status(400).json({
          success: false,
          error: 'Invalid date format after processing',
          details: 'Failed to convert date to string format'
        });
      }
      
      const appointmentQuery = `
        MATCH (a:Appointment)
        WHERE a.date = date($date) AND a.time = $time AND a.status = 'available'
        RETURN a
        LIMIT 1`;
      console.log("Executing query:", appointmentQuery, "with params:", { date: formattedDate, time });
      
      const appointmentResult = await session.run(appointmentQuery, { 
        date: formattedDate,
        time
      });
      
      console.log("Query results:", appointmentResult.records.length > 0 ? "appointment found" : "no appointment found");
      
      if (appointmentResult.records.length === 0) {
        // No matching appointment found
        console.log("No available appointment found for date:", formattedDate, "time:", time);
        return res.status(404).json({
          success: false,
          error: 'Appointment not available',
          message: 'The requested time slot is no longer available'
        });
      }
      
      // Get the appointment ID
      appointmentId = appointmentResult.records[0].get('a').properties.id;
      console.log("Found available appointment with ID:", appointmentId);
      
      // Update appointment status and create relationship
      await session.run(`
        MATCH (a:Appointment {id: $appointmentId})
        SET a.status = 'booked', a.updatedAt = datetime(), a.leadName = $name, a.leadEmail = $email, a.leadPhone = $phone, a.service = $service
        RETURN a`,
        { 
          appointmentId,
          name,
          email,
          phone,
          service: service || 'Initial Consultation'
        }
      );
      
      // Create relationship between lead and appointment
      await session.run(`
        MATCH (l:Lead {id: $leadId})
        MATCH (a:Appointment {id: $appointmentId})
        CREATE (l)-[r:HAS_APPOINTMENT {createdAt: datetime()}]->(a)
        RETURN l, r, a`,
        { 
          leadId,
          appointmentId 
        }
      );
      
      // Send confirmation email if email service is configured
      let emailSent = false;
      if (transporter) {
        try {
          await transporter.sendMail({
            from: `"Miller House Studio" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Appointment Confirmation',
            html: `
              <h1>Appointment Confirmation</h1>
              <p>Dear ${name},</p>
              <p>Your appointment has been confirmed for ${formattedDate} at ${time}.</p>
              <p>Service: ${service || 'Initial Consultation'}</p>
              <p>Thank you for choosing our services!</p>
            `
          });
          emailSent = true;
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
          // Continue with appointment booking even if email fails
        }
      }
      
      return res.json({
        success: true,
        data: {
          id: appointmentId,
          date: formattedDate,
          time,
          name,
          email,
          phone,
          service: service || 'Initial Consultation',
          leadId
        },
        emailSent,
        message: 'Appointment booked successfully'
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error booking appointment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to book appointment',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', neo4j: isConnected });
});

// And finally, the catch-all route for the React app
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