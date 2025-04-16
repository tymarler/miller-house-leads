const { v4: uuidv4 } = require('uuid');
const { driver, dbName, isConnected } = require('../config/database');

// In-memory storage for fallback
let leads = [];

// Create a new lead
async function createLead(leadData) {
  const lead = {
    id: uuidv4(),
    ...leadData,
    createdAt: new Date().toISOString()
  };

  try {
    if (isConnected) {
      const session = driver.session({ database: dbName });
      try {
        const result = await session.run(
          `CREATE (l:Lead {
            id: $id,
            name: $name,
            email: $email,
            phone: $phone,
            createdAt: $createdAt
          }) RETURN l`,
          {
            id: lead.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            createdAt: lead.createdAt
          }
        );
        return result.records[0].get('l').properties;
      } finally {
        await session.close();
      }
    }
    leads.push(lead);
    return lead;
  } catch (error) {
    console.error('Error creating lead:', error);
    leads.push(lead);
    return lead;
  }
}

// Get all leads
async function getLeads() {
  try {
    if (isConnected) {
      const session = driver.session({ database: dbName });
      try {
        const result = await session.run('MATCH (l:Lead) RETURN l ORDER BY l.createdAt DESC');
        return result.records.map(record => record.get('l').properties);
      } finally {
        await session.close();
      }
    }
    return leads;
  } catch (error) {
    console.error('Error getting leads:', error);
    return leads;
  }
}

// Get lead by ID
async function getLeadById(id) {
  try {
    if (isConnected) {
      const session = driver.session({ database: dbName });
      try {
        const result = await session.run(
          'MATCH (l:Lead {id: $id}) RETURN l',
          { id }
        );
        return result.records[0]?.get('l').properties || null;
      } finally {
        await session.close();
      }
    }
    return leads.find(l => l.id === id) || null;
  } catch (error) {
    console.error('Error getting lead by ID:', error);
    return leads.find(l => l.id === id) || null;
  }
}

// Get lead by email
async function getLeadByEmail(email) {
  try {
    if (isConnected) {
      const session = driver.session({ database: dbName });
      try {
        const result = await session.run(
          'MATCH (l:Lead {email: $email}) RETURN l',
          { email }
        );
        return result.records[0]?.get('l').properties || null;
      } finally {
        await session.close();
      }
    }
    return leads.find(l => l.email === email) || null;
  } catch (error) {
    console.error('Error getting lead by email:', error);
    return leads.find(l => l.email === email) || null;
  }
}

// Initialize mock leads if storage is empty
function initializeMockLeads() {
  if (leads.length === 0) {
    leads = [
      {
        id: uuidv4(),
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-0123',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '555-0124',
        createdAt: new Date().toISOString()
      }
    ];
  }
}

// Initialize mock leads
initializeMockLeads();

module.exports = {
  createLead,
  getLeads,
  getLeadById,
  getLeadByEmail
}; 