import React from 'react';
import './DTSVideos.css';

function DTSVideos() {
  return (
    <div className="dts-videos-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0' }}>DESIGN TEXAS STUDIOS</h1>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '500', color: '#555' }}>Video Gallery</h2>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
          Welcome to Design Texas Studios, your go-to destination for comprehensive design solutions. 
          We specialize in providing meticulously crafted 2D plans and lifelike 3D models.
        </p>
      </div>

      {/* Direct video embeds */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.8rem', textAlign: 'center', marginBottom: '20px' }}>Featured Videos</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
          <div>
            <iframe 
              width="100%" 
              height="315" 
              src="https://www.youtube.com/embed/U5nDPagdLPk" 
              title="2D to 3D transformation" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen>
            </iframe>
            <h3 style={{ margin: '10px 0', fontSize: '1.2rem' }}>Modern Farmhouse 2D to 3D</h3>
          </div>
          <div>
            <iframe 
              width="100%" 
              height="315" 
              src="https://www.youtube.com/embed/h9jv7O0bxGY" 
              title="Mediterranean Kitchen" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen>
            </iframe>
            <h3 style={{ margin: '10px 0', fontSize: '1.2rem' }}>Mediterranean Kitchen</h3>
          </div>
        </div>
      </div>

      {/* Simple image grid */}
      <div style={{ marginTop: '40px' }}>
        <h2 style={{ fontSize: '1.8rem', textAlign: 'center', marginBottom: '20px' }}>Design Gallery</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ overflow: 'hidden', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            <img 
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
              alt="House Exterior" 
              style={{ width: '100%', height: '200px', objectFit: 'cover' }}
            />
            <div style={{ padding: '10px', textAlign: 'center' }}>Modern Ranch Exterior</div>
          </div>
          <div style={{ overflow: 'hidden', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            <img 
              src="https://images.unsplash.com/photo-1600121848594-d8644e57abab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
              alt="Living Room" 
              style={{ width: '100%', height: '200px', objectFit: 'cover' }}
            />
            <div style={{ padding: '10px', textAlign: 'center' }}>Open Concept Living Room</div>
          </div>
          <div style={{ overflow: 'hidden', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            <img 
              src="https://images.unsplash.com/photo-1556911220-bda9f33a0e67?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
              alt="Kitchen" 
              style={{ width: '100%', height: '200px', objectFit: 'cover' }}
            />
            <div style={{ padding: '10px', textAlign: 'center' }}>Gourmet Kitchen</div>
          </div>
        </div>
      </div>

      <div style={{ margin: '40px 0', textAlign: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '10px' }}>Our Mission</h2>
        <p style={{ lineHeight: '1.6' }}>
          At Design Texas Studios, our mission is to leverage the power of our meticulously crafted 
          2D plans and lifelike 3D models to bring to life the vision of your dream home.
        </p>
      </div>

      <div style={{ marginTop: '40px', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Design Texas Studios</h3>
        <p style={{ color: '#666' }}>jay@designtexasstudios.com</p>
        <p style={{ color: '#666' }}>©2023 by Design Texas Studios</p>
      </div>
    </div>
  );
}

export default DTSVideos; 