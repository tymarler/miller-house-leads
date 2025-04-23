import React, { useState } from 'react';
import './DTSVideos.css';

function DTSVideos() {
  const [activeVideo, setActiveVideo] = useState(null);
  
  // Video data with actual embeddings
  const videos = [
    {
      id: 1,
      title: "2D to 3D transformation",
      description: "See how our 2D house plans transform into immersive 3D models",
      thumbnail: "https://via.placeholder.com/600x400?text=2D+to+3D+Transformation",
      videoUrl: "https://www.youtube.com/embed/U5nDPagdLPk",
      embedCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/U5nDPagdLPk" title="2D to 3D transformation" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
      id: 2,
      title: "Mediterranean Kitchen",
      description: "Explore our Mediterranean kitchen design in a detailed 3D walkthrough",
      thumbnail: "https://via.placeholder.com/600x400?text=Mediterranean+Kitchen",
      videoUrl: "https://www.youtube.com/embed/h9jv7O0bxGY",
      embedCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/h9jv7O0bxGY" title="Mediterranean Kitchen" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
      id: 3,
      title: "Design Texas, Farmhouse Walkthrough",
      description: "Take a virtual tour through our popular farmhouse design",
      thumbnail: "https://via.placeholder.com/600x400?text=Farmhouse+Walkthrough",
      videoUrl: "https://www.youtube.com/embed/bA7rTaYlZDU",
      embedCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/bA7rTaYlZDU" title="Farmhouse Walkthrough" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    },
    {
      id: 4,
      title: "Design Texas Studios: Modern Farmhouse",
      description: "See every detail of our modern farmhouse design in this comprehensive walkthrough",
      thumbnail: "https://via.placeholder.com/600x400?text=Modern+Farmhouse",
      videoUrl: "https://www.youtube.com/embed/RXYD9JvCmkQ",
      embedCode: '<iframe width="560" height="315" src="https://www.youtube.com/embed/RXYD9JvCmkQ" title="Modern Farmhouse" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    }
  ];

  // Close video modal
  const closeVideoModal = () => {
    setActiveVideo(null);
  };

  return (
    <div className="dts-videos-container">
      <div className="dts-videos-header">
        <h1>DESIGN TEXAS STUDIOS</h1>
        <h2>Video Gallery</h2>
      </div>

      <div className="dts-welcome-section">
        <h2>Welcome</h2>
        <p>
          Welcome to Design Texas Studios, your go-to destination for comprehensive design solutions. 
          We specialize in providing meticulously crafted 2D plans and lifelike 3D models, offering you 
          an unparalleled opportunity to truly envision your project from its very foundation to completion.
        </p>
      </div>

      <div className="dts-videos-grid">
        {videos.map(video => (
          <div key={video.id} className="dts-video-card">
            <div className="dts-video-thumbnail" onClick={() => setActiveVideo(video)}>
              <img src={video.thumbnail} alt={video.title} />
              <div className="dts-play-button">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Play Video</span>
              </div>
            </div>
            <h3>{video.title}</h3>
            <p>{video.description}</p>
          </div>
        ))}
      </div>

      {/* Video Showcase Section */}
      <div className="dts-video-showcase">
        <h2>Featured 2D to 3D Transformations</h2>
        <div className="dts-showcase-items">
          <div className="dts-showcase-item">
            <iframe 
              width="100%" 
              height="315" 
              src="https://www.youtube.com/embed/U5nDPagdLPk" 
              title="2D to 3D transformation" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen>
            </iframe>
            <h3>Modern Farmhouse 2D to 3D</h3>
          </div>
          <div className="dts-showcase-item">
            <iframe 
              width="100%" 
              height="315" 
              src="https://www.youtube.com/embed/h9jv7O0bxGY" 
              title="Mediterranean Kitchen" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen>
            </iframe>
            <h3>Mediterranean Kitchen Virtual Tour</h3>
          </div>
        </div>
      </div>

      {/* 2D vs 3D Comparison Section */}
      <div className="dts-comparison-section">
        <h2>2D Plans vs 3D Visualizations</h2>
        <p className="dts-comparison-intro">
          See the transformation from professional 2D floor plans to immersive 3D visualizations. 
          Our comprehensive process brings your dream home to life before construction begins.
        </p>
        
        <div className="dts-comparison-items">
          <div className="dts-comparison-item">
            <div className="dts-comparison-images">
              <div className="dts-comparison-image">
                <h4>2D Floor Plan</h4>
                <img src="https://via.placeholder.com/600x450?text=2D+Floor+Plan" alt="2D Floor Plan" />
              </div>
              <div className="dts-comparison-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
              <div className="dts-comparison-image">
                <h4>3D Visualization</h4>
                <img src="https://via.placeholder.com/600x450?text=3D+Visualization" alt="3D Visualization" />
              </div>
            </div>
            <h3>Modern Farmhouse</h3>
            <p>From basic floor plan to photo-realistic 3D model, our Modern Farmhouse design comes to life with detailed textures, lighting, and materials.</p>
          </div>
          
          <div className="dts-comparison-item">
            <div className="dts-comparison-images">
              <div className="dts-comparison-image">
                <h4>2D Floor Plan</h4>
                <img src="https://via.placeholder.com/600x450?text=2D+Floor+Plan" alt="2D Floor Plan" />
              </div>
              <div className="dts-comparison-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
              <div className="dts-comparison-image">
                <h4>3D Visualization</h4>
                <img src="https://via.placeholder.com/600x450?text=3D+Visualization" alt="3D Visualization" />
              </div>
            </div>
            <h3>Contemporary Kitchen</h3>
            <p>See how our sophisticated 2D kitchen design transforms into a stunning 3D space with realistic appliances, lighting effects, and material textures.</p>
          </div>
        </div>
      </div>

      {/* Design Gallery Section */}
      <div className="dts-gallery-section">
        <h2>More Design Inspirations</h2>
        <p className="dts-gallery-intro">
          Browse through our collection of stunning house designs and innovative interior concepts. 
          These visualizations showcase the detail and quality you can expect from Design Texas Studios.
        </p>
        
        <div className="dts-gallery-grid">
          <div className="dts-gallery-item">
            <img src="https://via.placeholder.com/400x300?text=House+Exterior" alt="House Exterior Design" />
            <div className="dts-gallery-caption">Modern Ranch Exterior</div>
          </div>
          <div className="dts-gallery-item">
            <img src="https://via.placeholder.com/400x300?text=Living+Room" alt="Living Room Design" />
            <div className="dts-gallery-caption">Open Concept Living Room</div>
          </div>
          <div className="dts-gallery-item">
            <img src="https://via.placeholder.com/400x300?text=Kitchen+Design" alt="Kitchen Design" />
            <div className="dts-gallery-caption">Gourmet Kitchen with Island</div>
          </div>
          <div className="dts-gallery-item">
            <img src="https://via.placeholder.com/400x300?text=Master+Suite" alt="Master Suite Design" />
            <div className="dts-gallery-caption">Luxury Master Suite</div>
          </div>
          <div className="dts-gallery-item">
            <img src="https://via.placeholder.com/400x300?text=Outdoor+Living" alt="Outdoor Living Design" />
            <div className="dts-gallery-caption">Covered Patio with Fireplace</div>
          </div>
          <div className="dts-gallery-item">
            <img src="https://via.placeholder.com/400x300?text=Bathroom" alt="Bathroom Design" />
            <div className="dts-gallery-caption">Spa-Inspired Master Bath</div>
          </div>
        </div>
      </div>

      <div className="dts-mission-section">
        <h2>Mission</h2>
        <p>
          At Design Texas Studios, our mission is clear: to leverage the power of our meticulously crafted 
          2D plans and lifelike 3D models to eradicate guesswork from your projects, reduce waste during construction, 
          and ultimately bring to life the vision of your dream home or building.
        </p>
      </div>

      <div className="dts-vision-section">
        <h2>Vision</h2>
        <p>
          At Design Texas Studios, our vision is to be the preeminent design firm that empowers our clients 
          to envision and transform their dreams into reality. We are committed to becoming the go-to destination 
          for exceptional 2D plans and lifelike 3D models for both residential and commercial buildings, 
          setting new standards in the industry.
        </p>
      </div>

      <div className="dts-footer">
        <h3>Design Texas Studios</h3>
        <p>jay@designtexasstudios.com</p>
        <p>©2023 by Design Texas Studios.</p>
      </div>

      {/* Video Modal */}
      {activeVideo && (
        <div className="dts-video-modal" onClick={closeVideoModal}>
          <div className="dts-video-modal-content" onClick={e => e.stopPropagation()}>
            <div className="dts-video-modal-header">
              <h3>{activeVideo.title}</h3>
              <button onClick={closeVideoModal} className="dts-close-modal">&times;</button>
            </div>
            <div className="dts-video-player">
              <iframe 
                width="100%" 
                height="450" 
                src={activeVideo.videoUrl} 
                title={activeVideo.title}
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen>
              </iframe>
            </div>
            <div className="dts-video-modal-footer">
              <p>{activeVideo.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DTSVideos; 