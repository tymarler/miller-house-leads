import React, { useState, useEffect } from 'react';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import './HousePlans.css';

// Sample house plan data - in a real app, this would come from an API
const sampleHousePlans = [
  {
    id: 1,
    name: 'Modern Farmhouse',
    description: 'A beautiful modern farmhouse design with open concept living spaces',
    squareFootage: 2800,
    bedrooms: 4,
    bathrooms: 3.5,
    garages: 2,
    floors: 2,
    price: 499,
    features: ['Open Floor Plan', 'Master Suite', 'Bonus Room', 'Walk-in Closets'],
    images: {
      thumbnail: 'https://via.placeholder.com/300x200?text=Modern+Farmhouse',
      floorplan2d: 'https://via.placeholder.com/800x600?text=Modern+Farmhouse+Floor+Plan',
      render3d: 'https://via.placeholder.com/800x600?text=Modern+Farmhouse+3D+View'
    }
  },
  {
    id: 2,
    name: 'Craftsman Cottage',
    description: 'Charming craftsman style with detailed woodwork and cozy spaces',
    squareFootage: 1900,
    bedrooms: 3,
    bathrooms: 2,
    garages: 1,
    floors: 1,
    price: 349,
    features: ['Front Porch', 'Fireplace', 'Home Office', 'Dining Room'],
    images: {
      thumbnail: 'https://via.placeholder.com/300x200?text=Craftsman+Cottage',
      floorplan2d: 'https://via.placeholder.com/800x600?text=Craftsman+Cottage+Floor+Plan',
      render3d: 'https://via.placeholder.com/800x600?text=Craftsman+Cottage+3D+View'
    }
  },
  {
    id: 3,
    name: 'Contemporary Ranch',
    description: 'Single-level living with modern design elements and spacious rooms',
    squareFootage: 2200,
    bedrooms: 3,
    bathrooms: 2.5,
    garages: 2,
    floors: 1,
    price: 399,
    features: ['Single Level', 'Great Room', 'Covered Patio', 'Large Kitchen'],
    images: {
      thumbnail: 'https://via.placeholder.com/300x200?text=Contemporary+Ranch',
      floorplan2d: 'https://via.placeholder.com/800x600?text=Contemporary+Ranch+Floor+Plan',
      render3d: 'https://via.placeholder.com/800x600?text=Contemporary+Ranch+3D+View'
    }
  },
  {
    id: 4,
    name: 'European Villa',
    description: 'Elegant European-inspired design with luxury features',
    squareFootage: 3500,
    bedrooms: 5,
    bathrooms: 4,
    garages: 3,
    floors: 2,
    price: 699,
    features: ['Grand Entrance', 'Home Theater', 'Wine Cellar', 'Outdoor Kitchen'],
    images: {
      thumbnail: 'https://via.placeholder.com/300x200?text=European+Villa',
      floorplan2d: 'https://via.placeholder.com/800x600?text=European+Villa+Floor+Plan',
      render3d: 'https://via.placeholder.com/800x600?text=European+Villa+3D+View'
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
    </div>
  );
}

export default HousePlans; 