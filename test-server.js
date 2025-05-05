const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    server: 'Test server'
  });
});

// Mock leads endpoint
app.get('/api/leads', (req, res) => {
  console.log('GET /api/leads called');
  res.json({
    success: true,
    data: [
      {
        id: '1',
        name: 'Test Lead',
        email: 'test@example.com',
        phone: '123-456-7890',
        state: 'Texas',
        squareFootage: 2500,
        financingStatus: 'Pre-approved',
        qualificationScore: 75,
        createdAt: new Date().toISOString()
      }
    ]
  });
});

// Mock appointments endpoint
app.get('/api/appointments', (req, res) => {
  console.log('GET /api/appointments called');
  res.json({
    success: true,
    data: [
      {
        id: '1',
        date: '2025-04-28',
        time: '10:00',
        status: 'available',
        salesmanId: '1',
        salesman: {
          id: '1',
          name: 'John Smith',
          email: 'john@example.com'
        }
      }
    ]
  });
});

// Mock salesmen endpoint
app.get('/api/salesmen', (req, res) => {
  console.log('GET /api/salesmen called');
  res.json({
    success: true,
    data: [
      {
        id: '1',
        name: 'John Smith',
        email: 'john@example.com',
        phone: '123-456-7890',
        priority: 1
      }
    ]
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log(`CORS is configured to allow all origins`);
}); 