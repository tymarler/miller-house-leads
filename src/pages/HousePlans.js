import React, { useState, useEffect } from 'react';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import './HousePlans.css';

// House plan data based on Designtexasstudios.com
const sampleHousePlans = [
  {
    id: 1,
    name: 'The Blanco River',
    description: 'A luxurious modern farmhouse design with open concept living spaces and an emphasis on indoor-outdoor connectivity. Perfect for entertaining and family living.',
    squareFootage: 3250,
    bedrooms: 4,
    bathrooms: 3.5,
    garages: 2,
    floors: 2,
    price: 599,
    features: ['Open Floor Plan', 'Master Suite', 'Outdoor Kitchen', 'Game Room', 'Covered Patio', 'Walk-in Closets'],
    images: {
      thumbnail: 'https://via.placeholder.com/300x200?text=Blanco+River',
      floorplan2d: 'https://via.placeholder.com/800x600?text=Blanco+River+Floor+Plan',
      render3d: 'https://via.placeholder.com/800x600?text=Blanco+River+3D+View'
    }
  },
  {
    id: 2,
    name: 'The San Marcos',
    description: 'A stunning single-story modern farmhouse with exceptional curb appeal. Features high ceilings throughout and a magnificent open concept layout with large kitchen island.',
    squareFootage: 2800,
    bedrooms: 4,
    bathrooms: 3,
    garages: 3,
    floors: 1,
    price: 549,
    features: ['Single Story', 'High Ceilings', 'Large Kitchen Island', 'Media Room', 'Covered Porch', 'Utility Room'],
    images: {
      thumbnail: 'https://via.placeholder.com/300x200?text=San+Marcos',
      floorplan2d: 'https://via.placeholder.com/800x600?text=San+Marcos+Floor+Plan',
      render3d: 'https://via.placeholder.com/800x600?text=San+Marcos+3D+View'
    }
  },
  {
    id: 3,
    name: 'The Guadalupe',
    description: 'A Texas Hill Country inspired design with stone and wood exterior elements. Features an open layout with a stunning kitchen, spacious bedrooms, and generous outdoor living areas.',
    squareFootage: 3100,
    bedrooms: 3,
    bathrooms: 2.5,
    garages: 2,
    floors: 1,
    price: 489,
    features: ['Hill Country Design', 'Split Bedroom Layout', 'Gourmet Kitchen', 'Vaulted Ceilings', 'Outdoor Living', 'Study'],
    images: {
      thumbnail: 'https://via.placeholder.com/300x200?text=Guadalupe',
      floorplan2d: 'https://via.placeholder.com/800x600?text=Guadalupe+Floor+Plan',
      render3d: 'https://via.placeholder.com/800x600?text=Guadalupe+3D+View'
    }
  },
  {
    id: 4,
    name: 'The Colorado',
    description: 'A rustic modern design with an impressive two-story great room and luxurious master suite. Includes a gourmet kitchen with walk-in pantry and separate dining area.',
    squareFootage: 3600,
    bedrooms: 4,
    bathrooms: 3.5,
    garages: 3,
    floors: 2,
    price: 649,
    features: ['Two-Story Great Room', 'Gourmet Kitchen', 'Luxury Master Suite', 'Home Office', 'Game Room', 'Mud Room'],
    images: {
      thumbnail: 'https://via.placeholder.com/300x200?text=Colorado',
      floorplan2d: 'https://via.placeholder.com/800x600?text=Colorado+Floor+Plan',
      render3d: 'https://via.placeholder.com/800x600?text=Colorado+3D+View'
    }
  },
  {
    id: 5,
    name: 'The Brazos',
    description: 'An elegant Texas Farmhouse design with wrap-around porch and welcoming interior spaces. Features a downstairs master suite and flexible upstairs bedrooms and game room.',
    squareFootage: 3200,
    bedrooms: 4,
    bathrooms: 3,
    garages: 2,
    floors: 2,
    price: 579,
    features: ['Wrap-Around Porch', 'Downstairs Master', 'Game Room', 'Flexible Upstairs', 'Butler\'s Pantry', 'Mud Room'],
    images: {
      thumbnail: 'https://via.placeholder.com/300x200?text=Brazos',
      floorplan2d: 'https://via.placeholder.com/800x600?text=Brazos+Floor+Plan',
      render3d: 'https://via.placeholder.com/800x600?text=Brazos+3D+View'
    }
  },
  {
    id: 6,
    name: 'The Llano',
    description: 'A compact but elegant modern farmhouse design perfect for smaller lots. Features an efficient layout with open concept living and a private master suite.',
    squareFootage: 2200,
    bedrooms: 3,
    bathrooms: 2,
    garages: 2,
    floors: 1,
    price: 399,
    features: ['Efficient Layout', 'Private Master Suite', 'Open Concept', 'Covered Patio', 'Kitchen Island', 'Walk-in Closets'],
    images: {
      thumbnail: 'https://via.placeholder.com/300x200?text=Llano',
      floorplan2d: 'https://via.placeholder.com/800x600?text=Llano+Floor+Plan',
      render3d: 'https://via.placeholder.com/800x600?text=Llano+3D+View'
    }
  }
];

function HousePlans() {
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [viewMode, setViewMode] = useState('2d'); // '2d' or '3d'
  
  const addToCart = (plan) => {
    if (!cart.some(item => item.id === plan.id)) {
      setCart([...cart, plan]);
    }
  };
  
  const removeFromCart = (planId) => {
    setCart(cart.filter(plan => plan.id !== planId));
  };
  
  const openPlanDetails = (plan) => {
    setSelectedPlan(plan);
  };
  
  const closePlanDetails = () => {
    setSelectedPlan(null);
    setViewMode('2d');
  };
  
  const cartTotal = cart.reduce((total, plan) => total + plan.price, 0);

  return (
    <div className="house-plans-container">
      <div className="plans-header">
        <h1>House Plan Designs</h1>
        <button 
          className="cart-button"
          onClick={() => setShowCart(!showCart)}
        >
          <ShoppingCartIcon className="h-6 w-6" />
          <span className="cart-count">{cart.length}</span>
        </button>
      </div>
      
      {/* Shopping Cart Overlay */}
      {showCart && (
        <div className="cart-overlay">
          <div className="cart-content">
            <h2>Your Cart</h2>
            {cart.length === 0 ? (
              <p>Your cart is empty</p>
            ) : (
              <>
                {cart.map(plan => (
                  <div key={plan.id} className="cart-item">
                    <div className="cart-item-info">
                      <img src={plan.images.thumbnail} alt={plan.name} />
                      <div>
                        <h3>{plan.name}</h3>
                        <p>{plan.squareFootage} sq ft</p>
                      </div>
                    </div>
                    <div className="cart-item-price">
                      <p>${plan.price}</p>
                      <button onClick={() => removeFromCart(plan.id)}>Remove</button>
                    </div>
                  </div>
                ))}
                <div className="cart-total">
                  <p>Total: ${cartTotal}</p>
                  <button className="checkout-button">Proceed to Checkout</button>
                </div>
              </>
            )}
            <button className="close-cart" onClick={() => setShowCart(false)}>Close</button>
          </div>
        </div>
      )}
      
      {/* Plan Detail Modal */}
      {selectedPlan && (
        <div className="plan-detail-modal">
          <div className="plan-detail-content">
            <div className="plan-detail-header">
              <h2>{selectedPlan.name}</h2>
              <button onClick={closePlanDetails}>×</button>
            </div>
            
            <div className="plan-detail-body">
              <div className="plan-view-controls">
                <button 
                  className={viewMode === '2d' ? 'active' : ''} 
                  onClick={() => setViewMode('2d')}
                >
                  2D Floor Plan
                </button>
                <button 
                  className={viewMode === '3d' ? 'active' : ''} 
                  onClick={() => setViewMode('3d')}
                >
                  3D Walkthrough
                </button>
              </div>
              
              <div className="plan-image-container">
                {viewMode === '2d' ? (
                  <img 
                    src={selectedPlan.images.floorplan2d} 
                    alt={`${selectedPlan.name} Floor Plan`}
                    className="plan-image"
                  />
                ) : (
                  <img 
                    src={selectedPlan.images.render3d} 
                    alt={`${selectedPlan.name} 3D View`}
                    className="plan-image"
                  />
                )}
              </div>
              
              <div className="plan-details">
                <div className="plan-specs">
                  <div className="spec-item">
                    <span className="spec-label">Square Feet:</span>
                    <span className="spec-value">{selectedPlan.squareFootage}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Bedrooms:</span>
                    <span className="spec-value">{selectedPlan.bedrooms}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Bathrooms:</span>
                    <span className="spec-value">{selectedPlan.bathrooms}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Garages:</span>
                    <span className="spec-value">{selectedPlan.garages}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Floors:</span>
                    <span className="spec-value">{selectedPlan.floors}</span>
                  </div>
                </div>
                
                <div className="plan-description">
                  <h3>Description</h3>
                  <p>{selectedPlan.description}</p>
                </div>
                
                <div className="plan-features">
                  <h3>Features</h3>
                  <ul>
                    {selectedPlan.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="plan-price">
                  <p>${selectedPlan.price}</p>
                  <button 
                    className="add-to-cart-button"
                    onClick={() => {
                      addToCart(selectedPlan);
                      closePlanDetails();
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* House Plans Grid */}
      <div className="plans-grid">
        {sampleHousePlans.map(plan => (
          <div key={plan.id} className="plan-card">
            <div className="plan-image" onClick={() => openPlanDetails(plan)}>
              <img src={plan.images.thumbnail} alt={plan.name} />
            </div>
            <div className="plan-info">
              <h3>{plan.name}</h3>
              <div className="plan-stats">
                <span>{plan.squareFootage} sq ft</span>
                <span>{plan.bedrooms} bed</span>
                <span>{plan.bathrooms} bath</span>
              </div>
              <p className="plan-price">${plan.price}</p>
              <div className="plan-actions">
                <button 
                  className="view-details-button"
                  onClick={() => openPlanDetails(plan)}
                >
                  View Details
                </button>
                <button 
                  className="add-to-cart-button"
                  onClick={() => addToCart(plan)}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Attribution */}
      <div className="attribution">
        <p>House plans inspired by <a href="https://designtexasstudios.com" target="_blank" rel="noopener noreferrer">Design Texas Studios</a>. 
        Visit their website for more custom home designs and detailed floor plans.</p>
      </div>
    </div>
  );
}

export default HousePlans; 