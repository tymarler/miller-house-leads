import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { HomeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';
import Gallery from './pages/Gallery';
import { Link, Routes, Route } from 'react-router-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import About from './pages/About';
import PhotoGallery from './pages/PhotoGallery';
import VideoGallery from './pages/VideoGallery';
import { PhotoIcon, VideoCameraIcon, UserGroupIcon, DocumentTextIcon, HomeModernIcon } from '@heroicons/react/24/outline';
import Admin from './pages/Admin';
import TestAPI from './pages/TestAPI';
import DebugAPI from './pages/DebugAPI';
import HousePlans from './pages/HousePlans';
import DTSVideos from './pages/DTSVideos';
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
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    state: '',
    squareFootage: '',
    timeline: '',
    financingStatus: '',
    lotStatus: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [qualificationScore, setQualificationScore] = useState(0);
  const [showFilterForm, setShowFilterForm] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [availableAppointments, setAvailableAppointments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [schedulingStatus, setSchedulingStatus] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [showScheduling, setShowScheduling] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [existingAppointment, setExistingAppointment] = useState(null);
  const [emailCheckStatus, setEmailCheckStatus] = useState(null);
  const [costs, setCosts] = useState(null);

  const getQualificationScore = () => {
    let score = 0;
    
    // Timeline
    if (formData.timeline === 'Immediate') score += 15;
    else if (formData.timeline === '3-6 months') score += 10;
    else if (formData.timeline === '6-12 months') score += 5;
    
    // Financing Status
    if (formData.financingStatus === 'Ready to proceed') score += 15;
    else if (formData.financingStatus === 'Pre-approved') score += 10;
    else if (formData.financingStatus === 'In process') score += 5;
    
    // Lot Status
    if (formData.lotStatus === 'Owned') score += 15;
    else if (formData.lotStatus === 'Under contract') score += 10;
    else if (formData.lotStatus === 'Looking') score += 5;
    
    return score;
  };

  const calculateCost = () => {
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
  };

  useEffect(() => {
    const score = getQualificationScore();
    setQualificationScore(score);
  }, [formData]);

  useEffect(() => {
    if (formData.state && formData.squareFootage) {
      const cost = calculateCost();
      setCosts(cost);
    } else {
      setCosts(null);
    }
  }, [formData.state, formData.squareFootage]);

  useEffect(() => {
    if (showScheduler) {
      fetchAvailableAppointments();
    }
  }, [showScheduler]);

  const getQualificationStatus = (score) => {
    if (score >= 40) {
      return {
        status: 'High Priority',
        message: 'We will contact you within 24 hours to schedule your consultation.',
        color: 'text-green-600',
        shouldSchedule: true,
        emailSubject: 'High Priority: Schedule Your Consultation with Miller House Studio',
        emailBody: 'Thank you for your interest in Miller House Studio. Based on your responses, you are a high priority lead. We will contact you within 24 hours to schedule your consultation. In the meantime, feel free to browse our portfolio at our website.'
      };
    } else if (score >= 25) {
      return {
        status: 'Medium Priority',
        message: 'We will contact you within 48 hours to discuss your project.',
        color: 'text-yellow-600',
        shouldSchedule: true,
        emailSubject: 'Medium Priority: Project Discussion with Miller House Studio',
        emailBody: 'Thank you for your interest in Miller House Studio. Based on your responses, we would like to discuss your project further. We will contact you within 48 hours to schedule a consultation. In the meantime, feel free to browse our portfolio at our website.'
      };
    } else {
      return {
        status: 'Low Priority',
        message: 'Thank you for your interest. We will contact you when we have availability.',
        color: 'text-gray-600',
        shouldSchedule: false,
        emailSubject: 'Thank You for Your Interest in Miller House Studio',
        emailBody: 'Thank you for your interest in Miller House Studio. We appreciate you taking the time to provide information about your project. At this time, we have limited availability, but we will keep your information on file and contact you when we have openings. In the meantime, feel free to browse our portfolio at our website.'
      };
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.email || !formData.phone || !formData.state) {
        setError('Please fill in all required fields');
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
    setError('');
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setFormData(prev => ({ ...prev, appointmentDate: date }));
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setFormData(prev => ({ ...prev, appointmentTime: time }));
  };

  const handleQualificationSubmit = async (e) => {
    e.preventDefault();
    if (!formData.squareFootage || !formData.timeline || !formData.financingStatus || !formData.lotStatus) {
      setError('Please fill in all required fields');
      return;
    }
    
    const score = getQualificationScore();
    const status = getQualificationStatus(score);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/leads`, {
        ...formData,
        score,
        status: status.status,
        emailSubject: status.emailSubject,
        emailBody: status.emailBody
      });

      if (response.data.success) {
        if (score >= 25) { // Medium or High priority
          setShowScheduler(true);
          setShowModal(false);
          fetchAvailableAppointments();
        } else {
          setSuccess(status.message);
          setShowSuccessMessage(true);
          setSuccessMessage(status.message);
          setShowModal(false);
        }
      } else {
        setError('Failed to submit form. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      setError('Please select both date and time');
      return;
    }

    console.log('Selected date:', selectedDate);
    console.log('Selected time:', selectedTime);

    setSubmitting(true);
    try {
      // Format date properly - use dateFormatted if available
      const formattedDate = selectedDate.includes('T') 
        ? selectedDate.split('T')[0]  // Extract date part from ISO string
        : selectedDate;
      
      console.log('Scheduling appointment with data:', {
        date: formattedDate,
        time: selectedTime,
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      });

      const response = await axios.post(`${API_BASE_URL}/api/appointments`, {
        date: formattedDate,
        time: selectedTime,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        service: 'Initial Consultation'
      });

      console.log('Appointment response:', response.data);

      if (response.data && response.data.success) {
        // Format the date nicely
        const apptDate = new Date(formattedDate);
        const displayDate = apptDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long', 
          day: 'numeric'
        });
        
        // Format the time nicely
        const timeDisplay = new Date(`2000-01-01T${selectedTime}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit'
        });
        
        setSuccess(
          <div className="space-y-5 text-center">
            <div className="text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900">Your Appointment is Confirmed!</h3>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 my-4">
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium text-gray-800">{displayDate}</span>
              </div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-gray-800">{timeDisplay}</span>
              </div>
            </div>
            
            <p className="text-gray-700">We've sent a confirmation email to <span className="font-medium">{formData.email}</span> with important preparation details.</p>
            
            <div className="mt-3 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
              <h4 className="font-medium text-gray-800 mb-2">Please Bring to Your Consultation:</h4>
              <ul className="text-left text-gray-700 space-y-1 pl-5 list-disc">
                <li>Inspiration photos or examples</li>
                <li>Preliminary budget information</li>
                <li>Any existing floor plans or surveys</li>
                <li>Questions you have about the design process</li>
              </ul>
            </div>
            
            {response.data.emailSent === false && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800">
                  <span className="font-medium">Note:</span> We were unable to send the confirmation email.
                  Please save your appointment details shown above.
                </p>
              </div>
            )}
          </div>
        );
        setShowScheduler(false);
        setCurrentStep(1);
        setFormData({
          name: '',
          email: '',
          phone: '',
          state: '',
          squareFootage: '',
          timeline: '',
          financingStatus: '',
          lotStatus: '',
          budgetRange: '',
          score: 0
        });
      } else {
        setError(response.data?.error || 'Failed to schedule appointment');
      }
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      console.error('Error details:', error.response?.data || 'No response data');
      setError(error.response?.data?.error || 'Failed to schedule appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePersonalInfoSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted, validating fields...');
    
    // Validate required fields
    if (!formData.name || !formData.email || !formData.phone || !formData.state) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      console.log('Checking for existing appointments...');
      // Check for existing appointments
      const response = await axios.get(`${API_BASE_URL}/api/appointments`);
      console.log('API response received:', response);
      
      if (!response.data || !response.data.data) {
        console.log('Unexpected API response format:', response.data);
        // Proceed to next step if we can't properly check
        setCurrentStep(2);
        return;
      }
      
      const appointments = response.data.data;
      console.log('Appointments retrieved:', appointments.length);
      
      // Check if user already has an appointment
      const existingAppointment = appointments.find(apt => {
        // Handle both possible data structures
        const email = apt.leadEmail || (apt.lead && apt.lead.email);
        const phone = apt.leadPhone || (apt.lead && apt.lead.phone);
        
        return (email && email === formData.email) || 
               (phone && phone === formData.phone);
      });
      
      if (existingAppointment) {
        console.log('Existing appointment found:', existingAppointment);
        
        // Get appointment details with proper fallbacks
        const aptDate = existingAppointment.date ? new Date(existingAppointment.date) : new Date();
        const aptTime = existingAppointment.time || '12:00';
        
        setError(
          <div>
            <p>You already have an appointment scheduled for {aptDate.toLocaleDateString()} at {aptTime}.</p>
            <p>Would you like to reschedule?</p>
            <div className="mt-4 flex gap-4">
              <button
                onClick={() => {
                  setError('');
                  setCurrentStep(2);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Yes, Reschedule
              </button>
              <button
                onClick={() => {
                  setError('');
                  handleContactClick();
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                No, Contact Support
              </button>
            </div>
          </div>
        );
        return;
      }

      console.log('No existing appointment found, proceeding to next step');
      // If no existing appointment, proceed to next step
      setCurrentStep(2);
    } catch (error) {
      console.error('Error checking appointments:', error);
      console.error('Error details:', error.response ? error.response.data : 'No response data');
      
      // Continue to next step despite error
      console.log('Proceeding to next step despite error');
      setCurrentStep(2);
    }
  };

  const handleCostSubmit = () => {
    setCurrentStep(3);
  };

  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const qualificationScore = getQualificationScore();
      const leadData = {
        ...formData,
        qualificationScore,
        squareFootage: parseInt(formData.squareFootage)
      };

      const response = await axios.post(`${API_BASE_URL}/api/leads`, leadData);
      
      if (response.data.success) {
        // Show scheduling section immediately
        setShowScheduling(true);
        setCurrentStep('scheduling');
        // Fetch available appointments
        fetchAvailableAppointments();
    } else {
        alert('Error saving lead data. Please try again.');
      }
    } catch (error) {
      console.error('Error saving lead:', error);
      alert('Error saving lead data. Please try again.');
    }
  };

  const handleScheduleLater = async () => {
    try {
      const score = getQualificationScore();
      const status = getQualificationStatus(score);
      
      const response = await axios.post(`${API_BASE_URL}/api/leads`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        state: formData.state,
        squareFootage: formData.squareFootage,
        timeline: formData.timeline,
        financingStatus: formData.financingStatus,
        lotStatus: formData.lotStatus,
        qualificationScore: score,
        status: status.status,
        emailSubject: status.emailSubject,
        emailBody: status.emailBody
      });

      if (response.data.success) {
        setShowScheduling(false);
        setSuccess(status.message);
        setShowSuccessMessage(true);
        setSuccessMessage(status.message);
        setFormData({
          name: '',
          email: '',
          phone: '',
          state: '',
          squareFootage: '',
          timeline: '',
          financingStatus: '',
          lotStatus: ''
        });
      }
    } catch (error) {
      setError('Error saving lead data. Please try again.');
    }
  };

  const fetchAvailableAppointments = async () => {
    try {
      console.log('Fetching available appointments...');
      const response = await axios.get(`${API_BASE_URL}/api/appointments?status=available`);
      console.log('API response:', response.data);
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        console.log(`Found ${response.data.data.length} appointments`);
        setAvailableAppointments(response.data.data.filter(apt => apt.status === 'available'));
      } else {
        console.error('Unexpected API response format:', response.data);
        setAvailableAppointments([]);
        setError('Failed to load appointments: Unexpected data format');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to load available appointments. Please try again later.');
      setAvailableAppointments([]);
    }
  };

  const handleRescheduleClick = () => {
    setExistingAppointment(null);
    setEmailCheckStatus('no-appointment');
    setShowScheduling(true);
    setIsRescheduling(true);
    // Fetch available appointments immediately
    fetchAvailableAppointments();
  };

  const handleScheduleClick = () => {
    setShowScheduler(true);
    setShowFilterForm(false);
  };

  const handleContactClick = () => {
    setShowModal(true);
    setModalType('contact');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      state: '',
      squareFootage: '',
      timeline: '',
      financingStatus: '',
      lotStatus: ''
    });
    setQualificationScore(0);
    setShowScheduler(false);
    setShowFilterForm(false);
    setShowSuccessMessage(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/submit-form`, formData);
      setSuccess('Form submitted successfully!');
      setShowModal(false);
    } catch (err) {
      setError('Error submitting form. Please try again.');
    }
    setSubmitting(false);
  };

  const getEmailMessage = (status) => {
    switch (status) {
      case 'checking':
        return 'Checking email availability...';
      case 'available':
        return 'Email is available';
      case 'unavailable':
        return 'Email is already registered';
      case 'error':
        return 'Error checking email availability';
      default:
        return '';
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

  const FilterForm = () => (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Qualification</h2>
      <form onSubmit={handleFilterSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Timeline</label>
          <select
            value={formData.timeline}
            onChange={(e) => setFormData({...formData, timeline: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          >
            <option value="">Select timeline</option>
            <option value="Immediate">Immediate</option>
            <option value="3-6 months">3-6 months</option>
            <option value="6-12 months">6-12 months</option>
            <option value="Just exploring">Just exploring</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Financing Status</label>
          <select
            value={formData.financingStatus}
            onChange={(e) => setFormData({...formData, financingStatus: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          >
            <option value="">Select financing status</option>
            <option value="Ready to proceed">Ready to proceed</option>
            <option value="Pre-approved">Pre-approved</option>
            <option value="In process">In process</option>
            <option value="Not started">Not started</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Lot Status</label>
          <select
            value={formData.lotStatus}
            onChange={(e) => setFormData({...formData, lotStatus: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          >
            <option value="">Select lot status</option>
            <option value="Owned">Owned</option>
            <option value="Under contract">Under contract</option>
            <option value="Looking">Looking</option>
            <option value="Not started">Not started</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  return (
    <Router>
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
                        <Link to="/house-plans" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300">
                          House Plans
                        </Link>
                        <Link to="/dts-videos" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-gray-300">
                          2D/3D Videos
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
                      onClick={() => setShowModal(true)}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Get Started
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Modal */}
              {showModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {currentStep === 1 ? 'Personal Information' : 'Project Information'}
                      </h2>
                      <button
                        onClick={() => {
                          setShowModal(false);
                          setCurrentStep(1);
                          setFormData({
                            name: '',
                            email: '',
                            phone: '',
                            state: '',
                            squareFootage: '',
                            timeline: '',
                            financingStatus: '',
                            lotStatus: ''
                          });
                        }}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {currentStep === 1 && (
                      <form onSubmit={handlePersonalInfoSubmit} className="space-y-6">
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
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      </form>
                    )}

                    {currentStep === 2 && (
                      <form onSubmit={handleQualificationSubmit} className="space-y-6">
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
                        {costs && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-green-50 p-3 rounded-lg shadow">
                              <h3 className="text-sm font-medium text-green-700">Low Estimate</h3>
                              <p className="text-lg font-semibold text-green-600">${costs.low.toLocaleString()}</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg shadow transform scale-105">
                              <h3 className="text-xl font-semibold text-blue-700">Average Estimate</h3>
                              <p className="text-3xl font-bold text-blue-600">${costs.average.toLocaleString()}</p>
                            </div>
                            <div className="bg-red-50 p-3 rounded-lg shadow">
                              <h3 className="text-sm font-medium text-red-700">High Estimate</h3>
                              <p className="text-lg font-semibold text-red-600">${costs.high.toLocaleString()}</p>
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Timeline</label>
                          <select
                            name="timeline"
                            value={formData.timeline}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                          >
                            <option value="">Select your timeline</option>
                            <option value="Immediate">Immediate</option>
                            <option value="3-6 months">3-6 months</option>
                            <option value="6-12 months">6-12 months</option>
                            <option value="12+ months">12+ months</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Lot Status</label>
                          <select
                            name="lotStatus"
                            value={formData.lotStatus}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                          >
                            <option value="">Select your lot status</option>
                            <option value="Owned">Owned</option>
                            <option value="Under contract">Under contract</option>
                            <option value="Looking">Looking</option>
                            <option value="Not started">Not started</option>
                          </select>
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Submit
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}

              <Routes>
                <Route path="/photo-gallery" element={<PhotoGallery />} />
                <Route path="/video-gallery" element={<VideoGallery />} />
                <Route path="/about" element={<About />} />
                <Route path="/test-api" element={<TestAPI />} />
                <Route path="/debug-api" element={<DebugAPI />} />
                <Route path="/house-plans" element={<HousePlans />} />
                <Route path="/dts-videos" element={<DTSVideos />} />
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

              {showScheduler && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full">
                    <h2 className="text-2xl font-bold mb-4">Schedule Your Appointment</h2>
                    <form onSubmit={handleScheduleSubmit}>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Available Appointments
                        </label>
                        <div className="max-h-60 overflow-y-auto border rounded">
                          {availableAppointments.length > 0 ? (
                            availableAppointments.map((appointment) => (
                              <div
                                key={`${appointment.date}-${appointment.time}`}
                                className={`p-3 cursor-pointer hover:bg-gray-100 ${
                                  selectedDate === appointment.date && selectedTime === appointment.time
                                    ? 'bg-blue-100'
                                    : ''
                                }`}
                                onClick={() => {
                                  setSelectedDate(appointment.date);
                                  setSelectedTime(appointment.time);
                                }}
                              >
                                <div className="font-medium">
                                  {appointment.dateFormatted 
                                    ? new Date(appointment.dateFormatted).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                      })
                                    : new Date(appointment.date.split('T')[0]).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                      })
                                  }
                                </div>
                                <div className="text-gray-600">
                                  {appointment.time 
                                    ? new Date(`2000-01-01T${appointment.time}`).toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                      })
                                    : '(No time specified)'
                                  }
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-gray-500">
                              No appointments available. Please try again later.
                            </div>
                          )}
                        </div>
                      </div>
                      {error && <div className="text-red-500 mb-4">{error}</div>}
                      <div className="flex justify-end gap-4">
                        <button
                          type="button"
                          onClick={() => setShowScheduler(false)}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!selectedDate || !selectedTime || submitting}
                          className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
                            (!selectedDate || !selectedTime || submitting) && 'opacity-50 cursor-not-allowed'
                          }`}
                        >
                          {submitting ? 'Scheduling...' : 'Schedule Appointment'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {success && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg p-6 max-w-lg w-full">
                    <div className="mb-4 flex justify-between">
                      <div className="text-2xl font-bold">Appointment Confirmed</div>
                      <button
                        onClick={() => setSuccess(null)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="overflow-y-auto max-h-[70vh]">
                      {success}
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => setSuccess(null)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 