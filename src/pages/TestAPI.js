import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

function TestAPI() {
  const [leadsData, setLeadsData] = useState(null);
  const [appointmentsData, setAppointmentsData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testConnections = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Attempting to connect to:', `${API_BASE_URL}/api/leads`);
        
        // Test with axios
        const leadsResponse = await axios.get(`${API_BASE_URL}/api/leads`);
        setLeadsData(leadsResponse.data);
        
        const appointmentsResponse = await axios.get(`${API_BASE_URL}/api/appointments`);
        setAppointmentsData(appointmentsResponse.data);
        
      } catch (err) {
        console.error('Error details:', err);
        setError({
          message: err.message,
          stack: err.stack,
          name: err.name,
          code: err.code,
          config: err.config
        });
      } finally {
        setLoading(false);
      }
    };
    
    testConnections();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>API Connection Test</h1>
      
      {loading && <p>Loading...</p>}
      
      {error && (
        <div style={{ background: '#ffebee', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
          <h2>Error:</h2>
          <p><strong>Message:</strong> {error.message}</p>
          <p><strong>Name:</strong> {error.name}</p>
          {error.code && <p><strong>Code:</strong> {error.code}</p>}
          <p><strong>URL:</strong> {error.config?.url}</p>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}
      
      {leadsData && (
        <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
          <h2>Leads Data:</h2>
          <p><strong>Success:</strong> {leadsData.success ? 'Yes' : 'No'}</p>
          <p><strong>Number of leads:</strong> {leadsData.data ? leadsData.data.length : 0}</p>
          <pre>{JSON.stringify(leadsData, null, 2)}</pre>
        </div>
      )}
      
      {appointmentsData && (
        <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '5px' }}>
          <h2>Appointments Data:</h2>
          <p><strong>Success:</strong> {appointmentsData.success ? 'Yes' : 'No'}</p>
          <p><strong>Number of appointments:</strong> {appointmentsData.data ? appointmentsData.data.length : 0}</p>
          <pre>{JSON.stringify(appointmentsData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default TestAPI; 