import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

function DebugAPI() {
  const [leadsResponse, setLeadsResponse] = useState(null);
  const [appointmentsResponse, setAppointmentsResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Make direct API calls and keep the full response
        const leads = await axios.get(`${API_BASE_URL}/api/leads`);
        const appointments = await axios.get(`${API_BASE_URL}/api/appointments`);
        
        setLeadsResponse(leads);
        setAppointmentsResponse(appointments);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) {
    return <div style={{padding: '20px'}}>Loading API data...</div>;
  }
  
  if (error) {
    return <div style={{padding: '20px', color: 'red'}}>Error: {error}</div>;
  }
  
  return (
    <div style={{padding: '20px', fontFamily: 'monospace'}}>
      <h1>API Debug Information</h1>
      
      <div style={{marginBottom: '40px'}}>
        <h2>Leads API Response</h2>
        <div style={{background: '#f5f5f5', padding: '15px', borderRadius: '5px', overflow: 'auto'}}>
          <h3>Status: {leadsResponse?.status}</h3>
          <h3>Headers:</h3>
          <pre>{JSON.stringify(leadsResponse?.headers, null, 2)}</pre>
          <h3>Data:</h3>
          <pre>{JSON.stringify(leadsResponse?.data, null, 2)}</pre>
          
          <h3>Extracted Leads ({leadsResponse?.data?.data?.length || 0}):</h3>
          <pre>{JSON.stringify(leadsResponse?.data?.data, null, 2)}</pre>
        </div>
      </div>
      
      <div>
        <h2>Appointments API Response</h2>
        <div style={{background: '#f5f5f5', padding: '15px', borderRadius: '5px', overflow: 'auto'}}>
          <h3>Status: {appointmentsResponse?.status}</h3>
          <h3>Headers:</h3>
          <pre>{JSON.stringify(appointmentsResponse?.headers, null, 2)}</pre>
          <h3>Data:</h3>
          <pre>{JSON.stringify(appointmentsResponse?.data, null, 2)}</pre>
          
          <h3>Extracted Appointments ({appointmentsResponse?.data?.data?.length || 0}):</h3>
          <pre>{JSON.stringify(appointmentsResponse?.data?.data, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}

export default DebugAPI; 