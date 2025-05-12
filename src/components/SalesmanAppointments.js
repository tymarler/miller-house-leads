import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

const SalesmanAppointments = ({ salesmanId, defaultStatus = "booked" }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState(defaultStatus);

  useEffect(() => {
    fetchAppointments();
  }, [salesmanId, statusFilter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/salesmen/${salesmanId}/appointments?status=${statusFilter}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch appointments');
      }
      
      setAppointments(data.data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (datetime) => {
    if (!datetime) return 'N/A';
    
    try {
      // If datetime is a Neo4j datetime object
      if (typeof datetime === 'object' && datetime.year) {
        const dt = datetime;
        const jsDate = new Date(Date.UTC(
          dt.year.low || dt.year,
          (dt.month.low || dt.month) - 1,
          dt.day.low || dt.day,
          dt.hour.low || dt.hour,
          dt.minute.low || dt.minute,
          dt.second.low || dt.second,
          (dt.nanosecond.low || dt.nanosecond) / 1000000
        ));
        
        if (!isNaN(jsDate.getTime())) {
          return jsDate.toLocaleString('en-US', {
            timeZone: 'America/New_York',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        }
      }
      
      // If datetime is a string
      const date = new Date(datetime);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting datetime:', error);
      return 'Invalid Date';
    }
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDateTime(appointment.datetime)}</td>
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