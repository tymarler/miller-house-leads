import React from 'react';
import './DTSVideos.css';

function DTSVideos() {
  // Video data structure for the gallery
  const videos = [
    {
      id: 1,
      title: "2D to 3D transformation",
      description: "See how our 2D house plans transform into immersive 3D models",
      thumbnail: "https://via.placeholder.com/600x400?text=2D+to+3D+Transformation",
      videoUrl: "#" // Would be replaced with actual video URL
    },
    {
      id: 2,
      title: "Mediterranean Kitchen",
      description: "Explore our Mediterranean kitchen design in a detailed 3D walkthrough",
      thumbnail: "https://via.placeholder.com/600x400?text=Mediterranean+Kitchen",
      videoUrl: "#"
    },
    {
      id: 3,
      title: "Design Texas, Farmhouse Walkthrough",
      description: "Take a virtual tour through our popular farmhouse design",
      thumbnail: "https://via.placeholder.com/600x400?text=Farmhouse+Walkthrough",
      videoUrl: "#"
    },
    {
      id: 4,
      title: "Design Texas Studios: Modern Farmhouse",
      description: "See every detail of our modern farmhouse design in this comprehensive walkthrough",
      thumbnail: "https://via.placeholder.com/600x400?text=Modern+Farmhouse",
      videoUrl: "#"
    }
  ];

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
            <div className="dts-video-thumbnail">
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
    </div>
  );
}

export default DTSVideos; 