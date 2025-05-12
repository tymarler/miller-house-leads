import axios from 'axios';
import API_BASE_URL from '../config';

/**
 * Gets all salesmen ordered by priority
 * @returns {Promise<Array>} - Array of salesmen
 */
export const getAllSalesmen = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/salesmen`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching salesmen:', error);
    throw error;
  }
};

/**
 * Gets a salesman by ID
 * @param {string} id - Salesman ID
 * @returns {Promise<Object>} - Salesman data
 */
export const getSalesmanById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/salesmen/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching salesman with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Fetches appointments for a specific salesman
 * @param {string} salesmanId - ID of the salesman
 * @param {string} [status] - Optional status filter (available, booked, etc.)
 * @returns {Promise<Array>} - Array of appointment objects
 */
export const getSalesmanAppointments = async (salesmanId, status = null) => {
  try {
    let url = `${API_BASE_URL}/api/salesmen/${salesmanId}/appointments`;
    
    // Add status filter if provided
    if (status) {
      url += `?status=${status}`;
    }
    
    console.log(`Fetching appointments for salesman: ${salesmanId}`);
    const response = await axios.get(url);
    
    if (!response.data || !response.data.success) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    console.log(`Retrieved ${response.data.data?.length || 0} appointments for salesman`);
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching salesman appointments:', error);
    throw error;
  }
};

/**
 * Gets only available appointments for a salesman
 * @param {string} salesmanId - ID of the salesman
 * @returns {Promise<Array>} - Array of available appointment objects
 */
export const getSalesmanAvailableAppointments = async (salesmanId) => {
  return getSalesmanAppointments(salesmanId, 'available');
};

/**
 * Gets only booked appointments for a salesman
 * @param {string} salesmanId - ID of the salesman
 * @returns {Promise<Array>} - Array of booked appointment objects
 */
export const getSalesmanBookedAppointments = async (salesmanId) => {
  return getSalesmanAppointments(salesmanId, 'booked');
};

/**
 * Gets appointments for a specific date
 * @param {string} salesmanId - ID of the salesman
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} [status] - Optional status filter
 * @returns {Promise<Array>} - Array of filtered appointment objects
 */
export const getSalesmanAppointmentsByDate = async (salesmanId, date, status = null) => {
  try {
    const appointments = await getSalesmanAppointments(salesmanId, status);
    
    // Normalize the input date to YYYY-MM-DD format
    const normalizedSearchDate = typeof date === 'string' ? date : 
      new Date(date).toISOString().split('T')[0];
    
    console.log('Filtering appointments for date:', normalizedSearchDate);
    
    return appointments.filter(appointment => {
      // Handle different date formats that might come from the API
      let appointmentDate = appointment.date;
      
      // If appointment date is a string but not in YYYY-MM-DD format
      if (typeof appointmentDate === 'string' && appointmentDate.includes('/')) {
        // Convert MM/DD/YYYY to YYYY-MM-DD
        const parts = appointmentDate.split('/');
        if (parts.length === 3) {
          appointmentDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
      } else if (typeof appointmentDate === 'object' && appointmentDate !== null) {
        // Handle Neo4j date object
        if (appointmentDate.year) {
          const year = appointmentDate.year.low || appointmentDate.year;
          const month = (appointmentDate.month.low || appointmentDate.month).toString().padStart(2, '0');
          const day = (appointmentDate.day.low || appointmentDate.day).toString().padStart(2, '0');
          appointmentDate = `${year}-${month}-${day}`;
        } else {
          // Other date object
          appointmentDate = new Date(appointmentDate).toISOString().split('T')[0];
        }
      }
      
      console.log(`Comparing: ${appointmentDate} with ${normalizedSearchDate}`);
      return appointmentDate === normalizedSearchDate || 
             (typeof appointment.date === 'string' && appointment.date.includes(normalizedSearchDate));
    });
  } catch (error) {
    console.error('Error fetching salesman appointments by date:', error);
    throw error;
  }
};

/**
 * Updates a salesman's availability by creating appointments
 * @param {string} salesmanId - ID of the salesman
 * @param {string} datetime - Date and time in YYYY-MM-DDTHH:MM format
 * @param {Array} timeSlots - Array of time slots (e.g. ["09:00", "10:00"])
 * @returns {Promise<Object>} - Response data
 */
export const updateSalesmanAvailability = async (salesmanId, datetime, timeSlots) => {
  try {
    console.log(`Updating availability for salesman ${salesmanId} on ${datetime}:`, timeSlots);
    const response = await axios.post(`${API_BASE_URL}/api/salesmen/${salesmanId}/availability`, {
      datetime,
      timeSlots
    });
    return response.data;
  } catch (error) {
    console.error('Error updating salesman availability:', error);
    throw error;
  }
};

/**
 * Creates a new salesman
 * @param {Object} salesmanData - Salesman data
 * @returns {Promise<Object>} - Created salesman data
 */
export const createSalesman = async (salesmanData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/salesmen`, salesmanData);
    return response.data;
  } catch (error) {
    console.error('Error creating salesman:', error);
    throw error;
  }
};

/**
 * Updates an existing salesman
 * @param {string} id - Salesman ID
 * @param {Object} salesmanData - Updated salesman data
 * @returns {Promise<Object>} - Updated salesman data
 */
export const updateSalesman = async (id, salesmanData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/api/salesmen/${id}`, salesmanData);
    return response.data;
  } catch (error) {
    console.error(`Error updating salesman with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a salesman
 * @param {string} id - Salesman ID
 * @returns {Promise<Object>} - Response data
 */
export const deleteSalesman = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/api/salesmen/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting salesman with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Format a date object from the API for display
 * @param {Object|string} dateObj - Date object from the API
 * @returns {string} Formatted date string
 */
export const formatAppointmentDate = (dateObj) => {
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