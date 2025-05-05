import React, { useState, useEffect } from 'react';
import './Admin.css';
import API_BASE_URL from '../config';
import axios from 'axios';
import SalesmanAppointments from '../components/SalesmanAppointments';
import { Link } from 'react-router-dom';

function Admin() {
  const [leads, setLeads] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [salesmen, setSalesmen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('appointments');
  const [successMessage, setSuccessMessage] = useState('');
  
  // For salesmen form
  const [newSalesman, setNewSalesman] = useState({
    name: '',
    email: '',
    phone: '',
    priority: 10
  });
  
  // For editing salesmen
  const [editingSalesman, setEditingSalesman] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // For editing leads
  const [editingLead, setEditingLead] = useState(null);
  const [showLeadEditModal, setShowLeadEditModal] = useState(false);
  
  // For editing appointments
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [showAppointmentEditModal, setShowAppointmentEditModal] = useState(false);
  
  // For availability form
  const [availabilityData, setAvailabilityData] = useState({
    salesmanId: '',
    date: new Date().toISOString().split('T')[0],
    timeSlots: []
  });
  
  const timeSlotOptions = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  const [activeSalesmanId, setActiveSalesmanId] = useState(null);

  const [appointmentFilter, setAppointmentFilter] = useState('any');
  const [filteredAppointments, setFilteredAppointments] = useState([]);

  const [availabilitySalesmanFilter, setAvailabilitySalesmanFilter] = useState('');
  const [filteredAvailableAppointments, setFilteredAvailableAppointments] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // First filter by status
    let filtered = [...appointments];
    
    if (appointmentFilter !== 'any') {
      filtered = filtered.filter(appointment => appointment.status === appointmentFilter);
    }
    
    // Show all appointments, regardless of whether they have a salesman or client
    setFilteredAppointments(filtered);
  }, [appointments, appointmentFilter]);

  // For availability tab to show available appointments
  useEffect(() => {
    if (activeTab === 'availability') {
      // Set filter to 'available' when the availability tab is active
      setAppointmentFilter('available');
    }
  }, [activeTab]);

  useEffect(() => {
    // Filter available appointments based on status and salesman
    let availableAppts = appointments.filter(appointment => appointment.status === 'available');
    
    // Add debug logging to see what data we're working with
    console.log('Available appointments before filtering:', availableAppts);
    
    if (availabilitySalesmanFilter) {
      availableAppts = availableAppts.filter(appointment => 
        appointment.salesmanId === availabilitySalesmanFilter || 
        (appointment.salesman && appointment.salesman.id === availabilitySalesmanFilter)
      );
    }
    
    setFilteredAvailableAppointments(availableAppts);
  }, [appointments, availabilitySalesmanFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorDetails(null);
      setShowErrorDetails(false);

      const [leadsResponse, appointmentsResponse, salesmenResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/leads`),
        axios.get(`${API_BASE_URL}/api/appointments`),
        axios.get(`${API_BASE_URL}/api/salesmen`)
      ]);

      // Log the full responses for debugging
      console.log('Leads API response:', leadsResponse);
      console.log('Appointments API response:', appointmentsResponse);
      console.log('Salesmen API response:', salesmenResponse);

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

      if (salesmenResponse.data && salesmenResponse.data.success) {
        setSalesmen(salesmenResponse.data.data || []);
      } else {
        console.error('Unexpected salesmen response format:', salesmenResponse.data);
        setSalesmen([]);
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

  // Format dates for frontend
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

  // Extract integer value from Neo4j integer objects
  const getIntValue = (val) => {
    if (val && typeof val === 'object' && 'low' in val && 'high' in val) {
      return val.low;
    }
    return val;
  };

  const toggleErrorDetails = () => {
    setShowErrorDetails(!showErrorDetails);
  };

  const handleSalesmanInputChange = (e) => {
    const { name, value } = e.target;
    setNewSalesman(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleEditSalesmanInputChange = (e) => {
    const { name, value } = e.target;
    setEditingSalesman(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSalesmanSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const { name, email, phone, priority } = newSalesman;
    const errors = [];
    
    if (!name) errors.push('Name is required');
    if (!email) errors.push('Email is required');
    else if (!/\S+@\S+\.\S+/.test(email)) errors.push('Email format is invalid');
    if (!phone) errors.push('Phone is required');
    else if (!/^(\+\d{1,2}\s?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(phone)) errors.push('Please enter a valid phone number');
    if (!priority && priority !== 0) errors.push('Priority is required');
    else if (isNaN(Number(priority))) errors.push('Priority must be a number');
    
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/salesmen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSalesman),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create salesman');
      }
      
      // Reset form and fetch updated data
      setNewSalesman({
        name: '',
        email: '',
        phone: '',
        priority: 1,
      });
      
      setError('');
      fetchData();
      setSuccessMessage('Salesman created successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error creating salesman:', error);
      setError(error.message || 'An error occurred while creating the salesman');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditSalesman = (salesman) => {
    setEditingSalesman(salesman);
    setShowEditModal(true);
  };
  
  const handleUpdateSalesman = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/api/salesmen/${editingSalesman.id}`, editingSalesman);
      setShowEditModal(false);
      setEditingSalesman(null);
      fetchData(); // Refresh the data
    } catch (err) {
      console.error('Error updating salesman:', err);
      setError(err.response?.data?.message || 'Failed to update salesman');
    }
  };
  
  const handleDeleteSalesman = async (id) => {
    if (window.confirm('Are you sure you want to delete this salesman?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/salesmen/${id}`);
        fetchData(); // Refresh the data
      } catch (err) {
        console.error('Error deleting salesman:', err);
        setError(err.response?.data?.message || 'Failed to delete salesman');
      }
    }
  };
  
  const handleAvailabilityChange = (e) => {
    const { name, value } = e.target;
    setAvailabilityData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleTimeSlotChange = (timeSlot) => {
    setAvailabilityData(prev => {
      const timeSlots = [...prev.timeSlots];
      if (timeSlots.includes(timeSlot)) {
        // Remove the time slot if already selected
        return {
          ...prev,
          timeSlots: timeSlots.filter(t => t !== timeSlot)
        };
      } else {
        // Add the time slot
        return {
          ...prev,
          timeSlots: [...timeSlots, timeSlot]
        };
      }
    });
  };
  
  const handleAvailabilitySubmit = async (e) => {
    e.preventDefault();
    if (!availabilityData.salesmanId || !availabilityData.date || availabilityData.timeSlots.length === 0) {
      setError('Please select a salesman, date, and at least one time slot');
      return;
    }
    
    try {
      await axios.post(
        `${API_BASE_URL}/api/salesmen/${availabilityData.salesmanId}/availability`,
        {
          date: availabilityData.date,
          timeSlots: availabilityData.timeSlots
        }
      );
      
      setAvailabilityData({
        salesmanId: '',
        date: new Date().toISOString().split('T')[0],
        timeSlots: []
      });
      
      fetchData(); // Refresh the data
      setError(null);
    } catch (err) {
      console.error('Error updating availability:', err);
      setError(err.response?.data?.message || 'Failed to update availability');
    }
  };

  const handleEditLead = (lead) => {
    setEditingLead(lead);
    setShowLeadEditModal(true);
  };
  
  const handleLeadInputChange = (e) => {
    const { name, value } = e.target;
    setEditingLead(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleUpdateLead = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/api/leads/${editingLead.id}`, editingLead);
      setShowLeadEditModal(false);
      setEditingLead(null);
      fetchData(); // Refresh the data
    } catch (err) {
      console.error('Error updating lead:', err);
      setError(err.response?.data?.message || 'Failed to update lead');
    }
  };
  
  const handleDeleteLead = async (id) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/leads/${id}`);
        fetchData(); // Refresh the data
      } catch (err) {
        console.error('Error deleting lead:', err);
        setError(err.response?.data?.message || 'Failed to delete lead');
      }
    }
  };

  const handleEditAppointment = (appointment) => {
    setEditingAppointment(appointment);
    setShowAppointmentEditModal(true);
  };
  
  const handleAppointmentInputChange = (e) => {
    const { name, value } = e.target;
    setEditingAppointment(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleUpdateAppointment = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/api/appointments/${editingAppointment.id}`, editingAppointment);
      setShowAppointmentEditModal(false);
      setEditingAppointment(null);
      fetchData(); // Refresh the data
    } catch (err) {
      console.error('Error updating appointment:', err);
      setError(err.response?.data?.message || 'Failed to update appointment');
    }
  };
  
  const handleDeleteAppointment = async (id) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/appointments/${id}`);
        fetchData(); // Refresh the data
      } catch (err) {
        console.error('Error deleting appointment:', err);
        setError(err.response?.data?.message || 'Failed to delete appointment');
      }
    }
  };

  // Render edit modal for salesmen
  const renderEditSalesmanModal = () => {
    if (!showEditModal || !editingSalesman) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-md">
          <h3 className="text-lg font-medium mb-3">Edit Salesman</h3>
          <form onSubmit={handleUpdateSalesman} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={editingSalesman.name}
                onChange={handleEditSalesmanInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={editingSalesman.email}
                onChange={handleEditSalesmanInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                value={editingSalesman.phone}
                onChange={handleEditSalesmanInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority (lower number = higher priority)
              </label>
              <input
                type="number"
                name="priority"
                value={editingSalesman.priority}
                onChange={handleEditSalesmanInputChange}
                className="w-full p-2 border rounded"
                min="1"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Render edit modal for leads
  const renderEditLeadModal = () => {
    if (!showLeadEditModal || !editingLead) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-md">
          <h3 className="text-lg font-medium mb-3">Edit Lead</h3>
          <form onSubmit={handleUpdateLead} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={editingLead.name}
                onChange={handleLeadInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={editingLead.email}
                onChange={handleLeadInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                value={editingLead.phone}
                onChange={handleLeadInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            {editingLead.state !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={editingLead.state || ''}
                  onChange={handleLeadInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            )}
            
            {editingLead.squareFootage !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Square Footage</label>
                <input
                  type="number"
                  name="squareFootage"
                  value={editingLead.squareFootage || ''}
                  onChange={handleLeadInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            )}
            
            {editingLead.financingStatus !== undefined && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Financing Status</label>
                <select
                  name="financingStatus"
                  value={editingLead.financingStatus || ''}
                  onChange={handleLeadInputChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select a status</option>
                  <option value="Ready to proceed">Ready to proceed</option>
                  <option value="Pre-approved">Pre-approved</option>
                  <option value="In process">In process</option>
                  <option value="Not ready">Not ready</option>
                </select>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowLeadEditModal(false)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Render edit modal for appointments
  const renderEditAppointmentModal = () => {
    if (!showAppointmentEditModal || !editingAppointment) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-md">
          <h3 className="text-lg font-medium mb-3">Edit Appointment</h3>
          <form onSubmit={handleUpdateAppointment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                name="date"
                value={editingAppointment.date}
                onChange={handleAppointmentInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <select
                name="time"
                value={editingAppointment.time}
                onChange={handleAppointmentInputChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select a time</option>
                {timeSlotOptions.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={editingAppointment.status}
                onChange={handleAppointmentInputChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="available">Available</option>
                <option value="booked">Booked</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            {/* Only show lead assignment if the status is booked */}
            {editingAppointment.status === 'booked' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Lead</label>
                <select
                  name="leadId"
                  value={editingAppointment.leadId || ''}
                  onChange={handleAppointmentInputChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Not assigned</option>
                  {leads.map(lead => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} ({lead.email})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAppointmentEditModal(false)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderSalesmenTab = () => {
    return (
      <div className="tab-content">
        <h2 className="text-xl font-semibold mb-4">Manage Salesmen</h2>
        
        {/* Success message */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{successMessage}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setSuccessMessage('')}>
              <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
              </svg>
            </span>
          </div>
        )}
        
        {/* Add new salesman form */}
        <div className="bg-white p-4 rounded shadow mb-6">
          <h3 className="text-lg font-medium mb-2">Add New Salesman</h3>
          <form onSubmit={handleSalesmanSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={newSalesman.name}
                  onChange={handleSalesmanInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={newSalesman.email}
                  onChange={handleSalesmanInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={newSalesman.phone}
                  onChange={handleSalesmanInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority (1-100) *</label>
                <input
                  type="number"
                  name="priority"
                  min="1"
                  max="100"
                  value={newSalesman.priority}
                  onChange={handleSalesmanInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Add Salesman
              </button>
            </div>
          </form>
        </div>
        
        {/* Set salesman availability */}
        <div className="bg-white p-4 rounded shadow mb-6">
          <h3 className="text-lg font-medium mb-2">Set Availability</h3>
          <form onSubmit={handleAvailabilitySubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Salesman *</label>
                <select
                  name="salesmanId"
                  value={availabilityData.salesmanId}
                  onChange={handleAvailabilityChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                >
                  <option value="">Select a salesman</option>
                  {salesmen.map(salesman => (
                    <option key={salesman.id} value={salesman.id}>
                      {salesman.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={availabilityData.date}
                  onChange={handleAvailabilityChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Slots *</label>
              <div className="grid grid-cols-3 gap-2">
                {timeSlotOptions.map(time => (
                  <label key={time} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={availabilityData.timeSlots.includes(time)}
                      onChange={() => handleTimeSlotChange(time)}
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{time}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Set Availability
              </button>
            </div>
          </form>
        </div>
        
        {/* Salesmen list */}
        <div className="bg-white rounded shadow overflow-hidden">
          <h3 className="text-lg font-medium p-4 bg-gray-50 border-b">Salesmen List</h3>
          {salesmen.length === 0 ? (
            <p className="p-4 text-gray-500">No salesmen found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salesmen.map(salesman => (
                    <React.Fragment key={salesman.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{salesman.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{salesman.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{salesman.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getIntValue(salesman.priority)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEditSalesman(salesman)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSalesman(salesman.id)}
                            className="text-red-600 hover:text-red-900 mr-3"
                          >
                            Delete
                          </button>
                          <Link
                            to={`/salesman/${salesman.id}`}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Dashboard
                          </Link>
                          <button
                            onClick={() => {
                              setActiveSalesmanId(activeSalesmanId === salesman.id ? null : salesman.id);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {activeSalesmanId === salesman.id ? 'Hide Appointments' : 'View Appointments'}
                          </button>
                        </td>
                      </tr>
                      {activeSalesmanId === salesman.id && (
                        <tr>
                          <td colSpan="5" className="px-6 py-4">
                            <SalesmanAppointments salesmanId={salesman.id} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
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

      <div className="mb-4">
        <div className="flex border-b border-gray-200">
          <button
            className={`py-2 px-4 ${activeTab === 'appointments' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('appointments')}
          >
            Appointments
          </button>
          <button
            className={`py-2 px-4 ${activeTab === 'leads' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('leads')}
          >
            Leads
          </button>
          <button
            className={`py-2 px-4 ${activeTab === 'salesmen' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('salesmen')}
          >
            Salesmen
          </button>
          <button
            className={`py-2 px-4 ${activeTab === 'availability' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('availability')}
          >
            Availability
          </button>
        </div>
      </div>
      
      {activeTab === 'appointments' && (
        <div>
          <h2>Scheduled Appointments</h2>
          <p className="text-gray-600 mb-3">Showing appointments with both a salesman and client assigned</p>
          <div className="flex justify-between mb-4">
            <div>
              <select 
                value={appointmentFilter}
                onChange={(e) => setAppointmentFilter(e.target.value)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="any">All Statuses</option>
                <option value="booked">Booked</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>{filteredAppointments.length} appointments found</div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Date</th>
                  <th className="py-2 px-4 border-b">Time</th>
                  <th className="py-2 px-4 border-b">Status</th>
                  <th className="py-2 px-4 border-b">Client</th>
                  <th className="py-2 px-4 border-b">Client Email</th>
                  <th className="py-2 px-4 border-b">Client Phone</th>
                  <th className="py-2 px-4 border-b">Salesman</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map(appointment => (
                  <tr key={appointment.id}>
                    <td className="py-2 px-4 border-b">{formatNeo4jDate(appointment.date)}</td>
                    <td className="py-2 px-4 border-b">{appointment.time}</td>
                    <td className="py-2 px-4 border-b">
                      <span className={`px-2 py-1 rounded text-xs ${
                        appointment.status === 'available' 
                          ? 'bg-green-100 text-green-800' 
                          : appointment.status === 'booked'
                            ? 'bg-blue-100 text-blue-800'
                            : appointment.status === 'completed'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-red-100 text-red-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">{appointment.lead?.name || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">{appointment.lead?.email || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">{appointment.lead?.phone || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">{appointment.salesman?.name || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditAppointment(appointment)}
                          className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAppointment(appointment.id)}
                          className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {activeTab === 'leads' && (
        <div>
          <h2>Leads ({leads.length})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Name</th>
                  <th className="py-2 px-4 border-b">Email</th>
                  <th className="py-2 px-4 border-b">Phone</th>
                  <th className="py-2 px-4 border-b">State</th>
                  <th className="py-2 px-4 border-b">Created</th>
                  <th className="py-2 px-4 border-b">Qualification</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id}>
                    <td className="py-2 px-4 border-b">{lead.name}</td>
                    <td className="py-2 px-4 border-b">{lead.email}</td>
                    <td className="py-2 px-4 border-b">{lead.phone}</td>
                    <td className="py-2 px-4 border-b">{lead.state || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">{new Date(lead.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 px-4 border-b">
                      {lead.qualificationScore ? (
                        <span className={`px-2 py-1 rounded text-xs ${
                          lead.qualificationScore >= 10 
                            ? 'bg-green-100 text-green-800' 
                            : lead.qualificationScore >= 5
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {lead.qualificationScore}
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditLead(lead)}
                          className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {activeTab === 'salesmen' && renderSalesmenTab()}
      
      {activeTab === 'availability' && (
        <div>
          <h2>Available Appointment Slots</h2>
          
          {/* Set availability form */}
          <div className="bg-white p-4 rounded shadow mb-6">
            <h3 className="text-lg font-medium mb-2">Set New Availability</h3>
            <form onSubmit={handleAvailabilitySubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Salesman *</label>
                  <select
                    name="salesmanId"
                    value={availabilityData.salesmanId}
                    onChange={handleAvailabilityChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="">Select a salesman</option>
                    {salesmen.map(salesman => (
                      <option key={salesman.id} value={salesman.id}>
                        {salesman.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={availabilityData.date}
                    onChange={handleAvailabilityChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Slots *</label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlotOptions.map(time => (
                    <label key={time} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={availabilityData.timeSlots.includes(time)}
                        onChange={() => handleTimeSlotChange(time)}
                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{time}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Set Availability
                </button>
              </div>
            </form>
          </div>
          
          {/* Current availability from database */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-medium mb-4">Current Available Appointment Slots</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by salesman:</label>
              <select 
                value={availabilitySalesmanFilter}
                onChange={(e) => setAvailabilitySalesmanFilter(e.target.value)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="">All Salesmen</option>
                {salesmen.map(salesman => (
                  <option key={salesman.id} value={salesman.id}>
                    {salesman.name}
                  </option>
                ))}
              </select>
            </div>
            
            {filteredAvailableAppointments.length === 0 ? (
              <p className="text-gray-500">No available appointments found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Salesman</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAvailableAppointments.map(appointment => (
                      <tr key={appointment.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{appointment.salesman?.name || 'N/A'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{formatNeo4jDate(appointment.date)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{appointment.time}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleEditAppointment(appointment)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAppointment(appointment.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {renderEditSalesmanModal()}
      {renderEditLeadModal()}
      {renderEditAppointmentModal()}
    </div>
  );
}

export default Admin; 