import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SalesmanAppointments from '../components/SalesmanAppointments';
import { getSalesmanById, updateSalesmanAvailability } from '../utils/salesmanUtils';
import API_BASE_URL from '../config';
import axios from 'axios';

const SalesmanDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [salesman, setSalesman] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('booked');
  const [showAddAppointmentsForm, setShowAddAppointmentsForm] = useState(false);
  const [availabilityData, setAvailabilityData] = useState({
    date: new Date().toISOString().split('T')[0],
    timeSlots: []
  });
  const [message, setMessage] = useState({ text: '', type: '' });

  const timeSlotOptions = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  useEffect(() => {
    const fetchSalesman = async () => {
      try {
        setLoading(true);
        const data = await getSalesmanById(id);
        if (data) {
          setSalesman(data);
          setError(null);
        } else {
          setError('Salesman not found');
        }
      } catch (err) {
        console.error('Error fetching salesman:', err);
        setError('Failed to load salesman data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSalesman();
    } else {
      setError('No salesman ID provided');
      setLoading(false);
    }
  }, [id]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
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
      const newTimeSlots = [...prev.timeSlots];
      
      if (newTimeSlots.includes(timeSlot)) {
        // Remove time slot if already selected
        return {
          ...prev,
          timeSlots: newTimeSlots.filter(t => t !== timeSlot)
        };
      } else {
        // Add time slot
        return {
          ...prev,
          timeSlots: [...newTimeSlots, timeSlot].sort()
        };
      }
    });
  };

  const handleAvailabilitySubmit = async (e) => {
    e.preventDefault();
    
    if (availabilityData.timeSlots.length === 0) {
      setMessage({ text: 'Please select at least one time slot', type: 'error' });
      return;
    }
    
    try {
      setMessage({ text: 'Saving availability...', type: 'info' });
      const response = await updateSalesmanAvailability(id, availabilityData.date, availabilityData.timeSlots);
      
      if (response.success) {
        setMessage({ text: 'Availability added successfully', type: 'success' });
        // Reset form after successful submission
        setAvailabilityData({
          date: new Date().toISOString().split('T')[0],
          timeSlots: []
        });
        // Refresh appointments by changing tab
        setActiveTab('available');
      } else {
        setMessage({ text: response.error || 'Failed to add availability', type: 'error' });
      }
    } catch (error) {
      console.error('Error setting availability:', error);
      setMessage({ text: 'An error occurred while setting availability', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-40 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button
          onClick={() => navigate('/admin')}
          className="mt-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Admin
        </button>
      </div>
    );
  }

  if (!salesman) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Notice: </strong>
          <span className="block sm:inline">No salesman data available.</span>
        </div>
        <button
          onClick={() => navigate('/admin')}
          className="mt-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Admin
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{salesman.name}'s Dashboard</h1>
        <button
          onClick={() => navigate('/admin')}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Admin
        </button>
      </div>

      {message.text && (
        <div className={`mb-4 p-4 rounded ${
          message.type === 'error' ? 'bg-red-100 text-red-700' : 
          message.type === 'success' ? 'bg-green-100 text-green-700' : 
          'bg-blue-100 text-blue-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Salesman Information</h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{salesman.name}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{salesman.email}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{salesman.phone}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Priority</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{salesman.priority}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${salesman.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {salesman.status || 'active'}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Add Availability</h3>
          <button 
            onClick={() => setShowAddAppointmentsForm(!showAddAppointmentsForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded text-sm"
          >
            {showAddAppointmentsForm ? 'Hide Form' : 'Show Form'}
          </button>
        </div>
        
        {showAddAppointmentsForm && (
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={handleAvailabilitySubmit} className="space-y-4">
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Slots *</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {timeSlotOptions.map(time => (
                    <label key={time} className="inline-flex items-center border rounded p-2 hover:bg-gray-50">
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
                  Add Availability
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="mt-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`${activeTab === 'booked' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => handleTabChange('booked')}
            >
              Booked Appointments
            </button>
            <button
              className={`${activeTab === 'available' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => handleTabChange('available')}
            >
              Available Slots
            </button>
            <button
              className={`${activeTab === 'all' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => handleTabChange('all')}
            >
              All Appointments
            </button>
          </nav>
        </div>
        
        <div className="mt-4">
          <SalesmanAppointments 
            salesmanId={id} 
            defaultStatus={activeTab === 'all' ? 'any' : activeTab} 
          />
        </div>
      </div>
    </div>
  );
};

export default SalesmanDashboard; 