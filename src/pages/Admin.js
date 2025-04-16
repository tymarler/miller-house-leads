import React, { useState, useEffect } from 'react';
import './Admin.css';
import API_BASE_URL from '../config';
import axios from 'axios';

function Admin() {
  const [leads, setLeads] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorDetails(null);
      setShowErrorDetails(false);

      const [leadsResponse, appointmentsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/leads`),
        axios.get(`${API_BASE_URL}/api/appointments`)
      ]);

      // Log the full responses for debugging
      console.log('Leads API response:', leadsResponse);
      console.log('Appointments API response:', appointmentsResponse);

      // Check if the response has the expected structure
      if (leadsResponse.data && leadsResponse.data.success) {
        setLeads(leadsResponse.data.data || []);
        console.log('Setting leads:', leadsResponse.data.data);
      } else {
        console.error('Unexpected leads response format:', leadsResponse.data);
        setLeads([]);
      }

      if (appointmentsResponse.data && appointmentsResponse.data.success) {
        setAppointments(appointmentsResponse.data.data || []);
      } else {
        console.error('Unexpected appointments response format:', appointmentsResponse.data);
        setAppointments([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
      setErrorDetails({
        message: err.message,
        stack: err.stack,
        name: err.name,
        code: err.code,
        config: err.config ? {
          url: err.config.url,
          method: err.config.method,
          headers: err.config.headers
        } : null
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNeo4jDate = (dateObj) => {
    if (!dateObj) return 'N/A';
    
    if (typeof dateObj === 'string') {
      return new Date(dateObj).toLocaleDateString();
    }
    
    if (dateObj.year && dateObj.month && dateObj.day) {
      const year = dateObj.year.low || dateObj.year;
      const month = (dateObj.month.low || dateObj.month) - 1;
      const day = dateObj.day.low || dateObj.day;
      return new Date(year, month, day).toLocaleDateString();
    }
    
    return 'Invalid Date';
  };

  const toggleErrorDetails = () => {
    setShowErrorDetails(!showErrorDetails);
  };

  if (loading) {
    return <div className="admin-container">Loading...</div>;
  }

  return (
    <div className="admin-container">
      <h1>Admin Dashboard</h1>
      
      {error && (
        <div className="error-section">
          <div className="error-message">
            {error}
            <button 
              className="error-details-toggle"
              onClick={toggleErrorDetails}
            >
              {showErrorDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
          {showErrorDetails && errorDetails && (
            <div className="error-details">
              <h3>Error Details:</h3>
              <pre>
                {JSON.stringify(errorDetails, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      <div className="leads-section">
        <h2>Leads ({leads.length})</h2>
        <div className="leads-grid">
          {leads.map(lead => (
            <div key={lead.id} className="lead-card">
              <h3>{lead.name}</h3>
              <p>Email: {lead.email}</p>
              <p>Phone: {lead.phone}</p>
              <p>State: {lead.state || 'N/A'}</p>
              <p>Square Footage: {lead.squareFootage || 'N/A'}</p>
              <p>Timeline: {lead.timeline || 'N/A'}</p>
              <p>Financing: {lead.financingStatus || 'N/A'}</p>
              <p>Lot Status: {lead.lotStatus || 'N/A'}</p>
              <p>Status: {lead.status || 'New'}</p>
              <p>Created: {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : 'N/A'}</p>
            </div>
          ))}
          {leads.length === 0 && (
            <div className="empty-message">No leads found</div>
          )}
        </div>
      </div>

      <div className="appointments-section">
        <h2>Appointments ({appointments.length})</h2>
        <div className="appointments-grid">
          {appointments.map(appointment => (
            <div key={appointment.id} className="appointment-card">
              <h3>{appointment.id}</h3>
              <p>Date: {formatNeo4jDate(appointment.date)}</p>
              <p>Time: {appointment.time}</p>
              <p>Notes: {appointment.notes || ''}</p>
              <p>Status: {appointment.status}</p>
              <p>Created: {appointment.createdAt ? new Date(appointment.createdAt).toLocaleString() : 'N/A'}</p>
            </div>
          ))}
          {appointments.length === 0 && (
            <div className="empty-message">No appointments found</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin; 