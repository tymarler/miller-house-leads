import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

const SalesmanAppointments = ({ salesmanId, defaultStatus = "booked" }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState(defaultStatus);

  useEffect(() => {
    if (!salesmanId) {
      setAppointments([]);
      setLoading(false);
      return;
    }
    
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        console.log(`Fetching appointments for salesman ${salesmanId} with status: ${statusFilter}`);
        
        const params = {};
        if (statusFilter !== "any") {
          params.status = statusFilter;
        }
        
        const response = await axios.get(`${API_BASE_URL}/api/salesmen/${salesmanId}/appointments`, { params });
        if (response.data && response.data.success) {
          console.log(`Found ${response.data.data?.length || 0} appointments`);
          setAppointments(response.data.data || []);
        } else {
          console.error('Unexpected response format:', response.data);
          setAppointments([]);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [salesmanId, statusFilter]);

  const formatDate = (dateObj) => {
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

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium">Appointments</h3>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="any">All Appointments</option>
          <option value="available">Available</option>
          <option value="booked">Booked</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full mb-2"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-800 p-3 rounded">
          {error}
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-gray-500 italic p-3 bg-gray-50 rounded">
          No {statusFilter !== 'any' ? statusFilter : ''} appointments found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(appointment.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{appointment.time}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${appointment.status === 'available' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'booked' ? 'bg-blue-100 text-blue-800' :
                        appointment.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'}`}>
                      {appointment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {appointment.lead?.name || (appointment.status === 'available' ? 'Available' : 'No client')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SalesmanAppointments; 