import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import About from './pages/About';
import PhotoGallery from './pages/PhotoGallery';
import VideoGallery from './pages/VideoGallery';
import Admin from './pages/Admin';
import SalesmanDashboard from './pages/SalesmanDashboard';
import API_BASE_URL from './config';

// Cost per square foot ranges by state
const stateCostRanges = {
  'Alabama': { min: 130, max: 150 },
  'Alaska': { min: 180, max: 250 },
  'Arizona': { min: 150, max: 200 },
  'Arkansas': { min: 120, max: 140 },
  'California': { min: 200, max: 600 },
  'Colorado': { min: 145, max: 250 },
  'Connecticut': { min: 160, max: 300 },
  'Delaware': { min: 140, max: 200 },
  'Florida': { min: 150, max: 250 },
  'Georgia': { min: 140, max: 180 },
  'Hawaii': { min: 205, max: 350 },
  'Idaho': { min: 130, max: 180 },
  'Illinois': { min: 140, max: 220 },
  'Indiana': { min: 130, max: 200 },
  'Iowa': { min: 130, max: 170 },
  'Kansas': { min: 130, max: 160 },
  'Kentucky': { min: 140, max: 180 },
  'Louisiana': { min: 130, max: 160 },
  'Maine': { min: 150, max: 220 },
  'Maryland': { min: 160, max: 250 },
  'Massachusetts': { min: 190, max: 350 },
  'Michigan': { min: 130, max: 220 },
  'Minnesota': { min: 160, max: 260 },
  'Mississippi': { min: 120, max: 140 },
  'Missouri': { min: 130, max: 180 },
  'Montana': { min: 140, max: 200 },
  'Nebraska': { min: 130, max: 170 },
  'Nevada': { min: 150, max: 220 },
  'New Hampshire': { min: 150, max: 230 },
  'New Jersey': { min: 170, max: 300 },
  'New Mexico': { min: 140, max: 190 },
  'New York': { min: 185, max: 400 },
  'North Carolina': { min: 140, max: 200 },
  'North Dakota': { min: 130, max: 170 },
  'Ohio': { min: 140, max: 240 },
  'Oklahoma': { min: 130, max: 160 },
  'Oregon': { min: 150, max: 250 },
  'Pennsylvania': { min: 140, max: 220 },
  'Rhode Island': { min: 160, max: 300 },
  'South Carolina': { min: 140, max: 200 },
  'South Dakota': { min: 130, max: 160 },
  'Tennessee': { min: 140, max: 180 },
  'Texas': { min: 140, max: 300 },
  'Utah': { min: 140, max: 200 },
  'Vermont': { min: 150, max: 220 },
  'Virginia': { min: 150, max: 220 },
  'Washington': { min: 140, max: 250 },
  'West Virginia': { min: 130, max: 170 },
  'Wisconsin': { min: 140, max: 220 },
  'Wyoming': { min: 140, max: 190 }
};

// Add state explanations
const stateExplanations = {
  'Alabama': 'Low labor and material costs in the South keep it affordable.',
  'Alaska': 'High transportation costs for materials and remote locations drive prices up.',
  'Arizona': 'Moderate costs with some increases in urban areas like Phoenix.',
  'Arkansas': 'One of the cheapest states due to low living costs and ample rural land.',
  'California': 'Varies widely; rural areas around $200, urban centers like San Francisco up to $600+ due to strict codes and high demand.',
  'Colorado': 'Higher in Denver due to growth; rural areas lean toward the lower end.',
  'Connecticut': 'High cost of living and labor in the Northeast push prices up.',
  'Delaware': 'Moderate costs with proximity to urban markets like Philadelphia.',
  'Florida': 'Hurricane-resistant builds increase costs, especially coastal areas.',
  'Georgia': 'Affordable in rural zones, pricier near Atlanta.',
  'Hawaii': 'The most expensive state due to shipping costs and limited land.',
  'Idaho': 'Lower costs but rising due to population growth in Boise.',
  'Illinois': 'Chicago spikes costs; rural areas stay lower.',
  'Indiana': 'Affordable Midwest rates with urban variation.',
  'Iowa': 'Low labor costs and flat terrain keep it economical.',
  'Kansas': 'Similar to Iowa, with minimal geographic challenges.',
  'Kentucky': 'Affordable, with slight increases near Louisville.',
  'Louisiana': 'Low costs offset by flood-resistant building needs.',
  'Maine': 'Harsh winters and rural logistics raise prices.',
  'Maryland': 'Proximity to D.C. and high living costs push it up.',
  'Massachusetts': 'High labor rates and strict codes in Boston drive the range.',
  'Michigan': 'Detroit around $180; rural areas cheaper.',
  'Minnesota': 'Cold climate requires extra insulation and heating.',
  'Mississippi': 'The cheapest state due to low wages and material costs.',
  'Missouri': 'Affordable, with urban areas like St. Louis slightly higher.',
  'Montana': 'Remote areas increase material transport costs.',
  'Nebraska': 'Flat land and low labor keep costs down.',
  'Nevada': 'Las Vegas growth pushes urban costs; rural stays moderate.',
  'New Hampshire': 'Similar to Maine, with rural and winter factors.',
  'New Jersey': 'High demand near NYC and strict regulations.',
  'New Mexico': 'Moderate costs with some rural savings.',
  'New York': 'Rural upstate around $185; NYC metro can hit $1,800 in extreme cases.',
  'North Carolina': 'Affordable South with urban spikes in Raleigh.',
  'North Dakota': 'Low population density keeps costs reasonable.',
  'Ohio': 'Midwest affordability with variation in cities like Columbus.',
  'Oklahoma': 'Low costs due to rural economy and minimal regulation.',
  'Oregon': 'Portland\'s eco-friendly codes raise costs; rural is cheaper.',
  'Pennsylvania': 'Pittsburgh and Philly higher; rural lower.',
  'Rhode Island': 'Small state, high living costs near Providence.',
  'South Carolina': 'Coastal areas pricier due to storm resistance.',
  'South Dakota': 'Low cost of living and labor.',
  'Tennessee': 'Affordable, with Nashville pushing urban costs up.',
  'Texas': 'Vast range; rural at $140, Austin or Houston closer to $300.',
  'Utah': 'Growth in Salt Lake City increases demand and costs.',
  'Vermont': 'Rural logistics and cold climate add expenses.',
  'Virginia': 'Northern VA near D.C. hits the high end.',
  'Washington': 'Seattle\'s tech boom spikes costs; rural is lower.',
  'West Virginia': 'Low wages and rural setting keep it cheap.',
  'Wisconsin': 'Midwest baseline with winter building costs.',
  'Wyoming': 'Sparse population and transport costs balance affordability.'
};

function App() {
  console.log("App component rendering");
  
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    state: '',
    squareFootage: '',
    financingStatus: '',
    timeline: '',
    lotStatus: '',
    service: 'Initial Consultation'
  });
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [qualificationScore, setQualificationScore] = useState(0);
  const [showScheduler, setShowScheduler] = useState(false);
  const [availableAppointments, setAvailableAppointments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [costs, setCosts] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const getQualificationStatus = (score) => {
    if (score >= 25) {
      return {
        status: 'High',
        message: 'You are a high priority lead!',
        emailSubject: 'High Priority Lead - Immediate Follow-up Required',
        emailBody: 'This lead has been identified as high priority. Please contact them immediately.'
      };
    } else if (score >= 15) {
      return {
        status: 'Medium',
        message: 'You are a medium priority lead.',
        emailSubject: 'Medium Priority Lead - Follow-up Required',
        emailBody: 'This lead has been identified as medium priority. Please follow up within 24 hours.'
      };
    } else {
      return {
        status: 'Low',
        message: 'You are a low priority lead.',
        emailSubject: 'Low Priority Lead - Follow-up Required',
        emailBody: 'This lead has been identified as low priority. Please follow up within 48 hours.'
      };
    }
  };

  const getQualificationScore = useCallback(() => {
    let score = 0;
    if (formData.financingStatus === 'Ready to proceed') score += 15;
    else if (formData.financingStatus === 'Pre-approved') score += 10;
    else if (formData.financingStatus === 'In process') score += 5;
    return score;
  }, [formData.financingStatus]);

  const calculateCost = useCallback(() => {
    if (!formData.state || !formData.squareFootage) return null;
    const stateRange = stateCostRanges[formData.state];
    const sqft = parseFloat(formData.squareFootage);
    const lowCost = stateRange.min * sqft;
    const highCost = stateRange.max * sqft;
    const averageCost = (lowCost + highCost) / 2;
    return {
      low: Math.round(lowCost),
      average: Math.round(averageCost),
      high: Math.round(highCost)
    };
  }, [formData.state, formData.squareFootage]);

  const fetchAvailableAppointments = useCallback(async () => {
    try {
      console.log("Fetching available appointments...");
      const response = await axios.get(`${API_BASE_URL}/api/appointments?status=available`);
      console.log("Appointments response:", response.data);
      
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }
      
      const appointments = response.data.data || [];
      console.log("Available appointments:", appointments);
      
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      
      const formattedAppointments = appointments
        .filter(appointment => {
          // Use the timestamp if available, otherwise fall back to datetime
          const appointmentTime = appointment.timestamp || new Date(appointment.datetime).getTime();
          return appointmentTime >= twoHoursFromNow.getTime();
        })
        .sort((a, b) => {
          // Sort by timestamp if available, otherwise by datetime
          const timeA = a.timestamp || new Date(a.datetime).getTime();
          const timeB = b.timestamp || new Date(b.datetime).getTime();
          return timeA - timeB;
        });
      
      console.log("Filtered appointments:", formattedAppointments);
      
      if (formattedAppointments.length === 0) {
        setError('No available appointments found. Please try again later.');
      } else {
        setError('');
      }
      
      setAvailableAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to fetch appointments. Please try again later.');
    }
  }, []);

  useEffect(() => {
    const score = getQualificationScore();
    setQualificationScore(score);
  }, [getQualificationScore]);

  useEffect(() => {
    if (formData.state && formData.squareFootage) {
      const cost = calculateCost();
      setCosts(cost);
    } else {
      setCosts(null);
    }
  }, [formData.state, formData.squareFootage, calculateCost]);

  useEffect(() => {
    if (showScheduler) {
      fetchAvailableAppointments();
    }
  }, [showScheduler, fetchAvailableAppointments]);

  const handleContactClick = () => {
    setShowModal(true);
  };

  const handleInputChange = async (e) => {
    if (!e || !e.target) {
      console.error('Invalid event object:', e);
      return;
    }

    const { name, value } = e.target;
    if (!name || typeof name !== 'string') {
      console.error('Invalid input name:', name);
      return;
    }

    if (value === undefined || value === null) {
      console.error('Invalid input value:', value);
      return;
    }

    setFormData(prev => {
      if (!prev || typeof prev !== 'object') {
        console.error('Invalid formData state:', prev);
        return { [name]: value };
      }
      return { ...prev, [name]: value };
    });
    
    // Check for existing appointments when email is entered
    if (name === 'email' && value) {
      try {
        // Make API request to check appointments
        const response = await axios.get(`${API_BASE_URL}/api/appointments`);
        
        // Log the full response for debugging
        console.log('Full server response:', JSON.stringify(response.data, null, 2));
        
        // Validate the response structure
        if (!response || !response.data) {
          console.error('Invalid response:', response);
          setError('Error checking appointments. Please try again.');
          return;
        }

        if (!response.data.success) {
          console.error('Response indicates failure:', response.data);
          setError('Error checking appointments. Please try again.');
          return;
        }

        // Extract appointments from response
        const appointments = response.data.data;
        if (!Array.isArray(appointments)) {
          console.error('Appointments is not an array:', appointments);
          setError('Error checking appointments. Please try again.');
          return;
        }

        // Check for existing appointment
        const hasExistingAppointment = appointments.some(appointment => {
          // Log each appointment for debugging
          console.log('Checking appointment:', appointment);
          
          // Check if appointment has lead data
          if (!appointment || !appointment.l) {
            return false;
          }

          // Check if lead has email
          if (!appointment.l.email) {
            return false;
          }

          // Compare emails (case-insensitive)
          return appointment.l.email.toLowerCase() === value.toLowerCase();
        });

        if (hasExistingAppointment) {
          setError('You already have an appointment scheduled. Please contact support to reschedule.');
          setShowModal(false);
        } else {
          setError(''); // Clear any previous errors
        }
      } catch (error) {
        console.error('Error checking appointments:', error);
        setError('Error checking appointment availability. Please try again.');
      }
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!selectedAppointment) {
        setError('Please select an appointment time');
        setSubmitting(false);
        return;
      }

      const appointmentDateTime = new Date(selectedAppointment.datetime);
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      
      console.log('Selected datetime:', appointmentDateTime);
      console.log('Current time:', now);
      console.log('Two hours from now:', twoHoursFromNow);
      
      if (appointmentDateTime < twoHoursFromNow) {
        setError('Appointments must be scheduled at least 2 hours in advance');
        setSubmitting(false);
        return;
      }

      // First check if the appointment is still available
      const checkResponse = await axios.get(`${API_BASE_URL}/api/appointments?datetime=${selectedAppointment.datetime}&status=available`);
      
      if (!checkResponse.data.success || checkResponse.data.data.length === 0) {
        setError('This appointment slot is no longer available. Please select another time.');
        setSubmitting(false);
        return;
      }

      // Debug logging for form data
      console.log('Current form data:', formData);
      console.log('Selected appointment:', selectedAppointment);

      const requestData = {
        datetime: selectedAppointment.datetime,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        service: formData.service
      };
      
      console.log('Sending request data:', requestData);
      
      const response = await axios.post(`${API_BASE_URL}/api/appointments`, requestData);

      if (response.data.success) {
        setShowSuccessMessage(true);
        setSuccessMessage('Appointment scheduled successfully!');
        setShowScheduler(false);
        setSelectedAppointment(null);
        setFormData({
          name: '',
          email: '',
          phone: '',
          service: 'Initial Consultation'
        });
        // Refresh available appointments
        fetchAvailableAppointments();
      } else {
        setError(response.data.error || 'Failed to schedule appointment');
      }
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      if (error.response?.status === 404) {
        setError('This appointment slot is no longer available. Please select another time.');
      } else {
        setError(error.response?.data?.error || 'Failed to schedule appointment');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePersonalInfoSubmit = async (event) => {
    if (!event || typeof event.preventDefault !== 'function') {
      console.error('Invalid event object:', event);
      return;
    }
    event.preventDefault();
    
    // Validate formData
    if (!formData || typeof formData !== 'object') {
      console.error('Invalid formData:', formData);
      setError('Invalid form data. Please try again.');
      return;
    }
    
    // Validate all required fields
    const requiredFields = ['name', 'email', 'phone', 'state', 'squareFootage', 'financingStatus'];
    const missingFields = requiredFields.filter(field => {
      if (!formData[field] || typeof formData[field] !== 'string') {
        return true;
      }
      return false;
    });
    
    if (missingFields.length > 0) {
      setError(`Please complete all required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate phone number (basic check for length)
    const phoneNumber = formData.phone.replace(/\D/g, '');
    if (phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    try {
      console.log("Form submitted successfully");
      
      // Validate state before proceeding
      if (!formData.state || typeof formData.state !== 'string') {
        setError('Invalid state selection');
        return;
      }

      // Validate square footage
      const squareFootage = parseInt(formData.squareFootage);
      if (isNaN(squareFootage) || squareFootage <= 0) {
        setError('Please enter a valid square footage');
        return;
      }

      // Check for existing appointments
      const response = await axios.get(`${API_BASE_URL}/api/appointments`);
      
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }
      
      const appointments = response.data.data || [];
      console.log("Appointments response:", appointments);
      
      // Check for existing appointment with this email
      const hasExistingAppointment = appointments.some(appointment => {
        if (!appointment || !appointment.lead) {
          return false;
        }
        return appointment.lead.email.toLowerCase() === formData.email.toLowerCase();
      });

      if (hasExistingAppointment) {
        setError('You already have an appointment scheduled. Please contact support to reschedule.');
        setShowModal(false);
      } else {
        setError(''); // Clear any previous errors
        setCurrentStep(2); // Move to the next step
        setShowScheduler(true); // Show the scheduler
        setShowModal(false); // Hide the modal
      }
    } catch (error) {
      console.error('Error checking appointments:', error);
      setError('Error checking appointment availability. Please try again.');
    }
  };

  const handleFilterSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/filter`, formData);
      setQualificationScore(response.data.score);
      setShowScheduler(response.data.qualified);
      setShowSuccessMessage(true);
      setSuccessMessage(response.data.qualified ? 
        'Congratulations! You qualify for a consultation. Please schedule your appointment.' : 
        'Thank you for your interest. We will review your information and contact you soon.');
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center">
                <span className="text-xl font-bold">Home</span>
              </Link>
              <Link to="/admin" className="flex items-center ml-8">
                <span className="text-xl">Admin</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/admin" element={<Admin />} />
        <Route path="/photo-gallery" element={<PhotoGallery />} />
        <Route path="/video-gallery" element={<VideoGallery />} />
        <Route path="/about" element={<About />} />
        <Route path="/salesman/:id" element={<SalesmanDashboard />} />
        <Route path="/" element={
          <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white shadow">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex">
                    <div className="flex-shrink-0 flex items-center">
                      <Link to="/" className="text-xl font-bold text-gray-800">Miller House Studio</Link>
                    </div>
                    <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                      <Link to="/photo-gallery" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300">
                        Photo Gallery
                      </Link>
                      <Link to="/video-gallery" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300">
                        Video Gallery
                      </Link>
                      <Link to="/about" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300">
                        About
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => setShowModal(true)}
                      className="ml-8 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Schedule Meeting
                    </button>
                  </div>
                </div>
              </div>
            </nav>

            {/* Hero Section */}
            <div className="relative bg-gray-900 h-[600px]">
              <div className="absolute inset-0">
                <img
                  src="/images/BackGround.jpg"
                  alt="Modern house exterior"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
              </div>
              <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">Let's Design Your Dream Home!</h1>
                <p className="mt-6 text-xl text-gray-300 max-w-3xl">
                  Let us help you create the home of your dreams with our expert design and construction services.
                </p>
                <div className="mt-10">
                  <button
                    onClick={() => {
                      console.log("Get Started button clicked, setting showModal to true");
                      setShowModal(true);
                      console.log("Current showModal state:", showModal);
                    }}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>

            {/* Home page content */}
            <div className="container mx-auto px-4 py-8">
              {!showSuccessMessage && (
                <div className="bg-white p-6 rounded-lg shadow-lg max-h-[80vh] overflow-y-auto">
                  <div className="mb-4">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">Custom Home Consultation</h2>
                    <p className="text-gray-600">
                      Click the "Get Started" button above to request your free consultation.
                    </p>
                    
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={() => {
                          console.log("Opening form modal");
                          setShowModal(true);
                        }}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Get Started Now
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        } />
      </Routes>

      {showSuccessMessage && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Thank You!</h2>
            <p className="mb-4">{successMessage}</p>
            {qualificationScore >= 50 && (
              <div className="mb-4">
                <p className="text-lg font-semibold">Your Qualification Score: {qualificationScore}%</p>
                <p className="text-sm text-gray-600">Estimated Cost: ${costs?.toLocaleString()}</p>
              </div>
            )}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowSuccessMessage(false);
                  if (qualificationScore >= 50) {
                    setShowScheduler(true);
                  }
                }}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {qualificationScore >= 50 ? 'Schedule Appointment' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          {console.log("Modal component rendering, showModal is true")}
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h2 className="text-2xl font-bold">Get Started</h2>
              <button 
                onClick={() => {
                  console.log("Modal close button clicked");
                  setShowModal(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="max-w-screen-lg mx-auto px-2 sm:px-4">
              <div className="bg-white rounded-lg max-w-xl mx-auto">
                <form onSubmit={handlePersonalInfoSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select your state</option>
                      {Object.keys(stateCostRanges).map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Square Footage</label>
                    <input
                      type="number"
                      name="squareFootage"
                      value={formData.squareFootage}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  {formData.squareFootage && formData.state && costs && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Estimated Project Cost</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-green-50 p-3 rounded-lg shadow">
                          <h4 className="text-sm font-medium text-green-700">Low Estimate</h4>
                          <p className="text-lg font-semibold text-green-600">${costs.low.toLocaleString()}</p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg shadow transform scale-105">
                          <h4 className="text-xl font-semibold text-blue-700">Average Estimate</h4>
                          <p className="text-2xl font-bold text-blue-600">${costs.average.toLocaleString()}</p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg shadow">
                          <h4 className="text-sm font-medium text-red-700">High Estimate</h4>
                          <p className="text-lg font-semibold text-red-600">${costs.high.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Financing Status</label>
                    <select
                      name="financingStatus"
                      value={formData.financingStatus}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select your financing status</option>
                      <option value="Ready to proceed">Ready to proceed</option>
                      <option value="Pre-approved">Pre-approved</option>
                      <option value="In process">In process</option>
                    </select>
                  </div>
                  
                  {error && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-md">
                      {error}
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {showScheduler && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Schedule Your Appointment</h2>
            <form onSubmit={handleScheduleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Service Type
                </label>
                <select
                  name="service"
                  value={formData.service}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="Initial Consultation">Initial Consultation</option>
                  <option value="Design Review">Design Review</option>
                  <option value="Construction Planning">Construction Planning</option>
                  <option value="Project Management">Project Management</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Available Appointments
                </label>
                {availableAppointments.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto border rounded">
                    {availableAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className={`p-4 border rounded-lg cursor-pointer ${
                          selectedAppointment?.id === appointment.id
                            ? 'bg-blue-100 border-blue-500'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          console.log("Selected appointment:", appointment);
                          setSelectedAppointment(appointment);
                        }}
                      >
                        <div className="font-medium">
                          {new Date(appointment.datetime).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500">No available appointments found.</div>
                )}
              </div>
              {error && <div className="text-red-500 mb-4">{error}</div>}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduler(false);
                    setCurrentStep(1);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedAppointment || submitting}
                  className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
                    (!selectedAppointment || submitting) && 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  {submitting ? 'Scheduling...' : 'Schedule Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 