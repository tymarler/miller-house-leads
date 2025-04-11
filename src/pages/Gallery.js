import React, { useState } from 'react';

const Gallery = () => {
  const [activeTab, setActiveTab] = useState('photos');

  const photos = [
    {
      id: 1,
      title: 'Modern Farmhouse',
      description: 'A beautiful modern farmhouse design with open concept living',
      imageUrl: '/images/modern-farmhouse.jpg'
    },
    {
      id: 2,
      title: 'Luxury Estate',
      description: 'Elegant luxury estate with custom finishes and amenities',
      imageUrl: '/images/luxury-estate.jpg'
    },
    {
      id: 3,
      title: 'Contemporary Home',
      description: 'Sleek contemporary design with clean lines and modern aesthetics',
      imageUrl: '/images/contemporary-home.jpg'
    },
    {
      id: 4,
      title: 'Traditional Manor',
      description: 'Classic traditional manor with timeless architecture',
      imageUrl: '/images/traditional-manor.jpg'
    }
  ];

  const videos = [
    {
      id: 1,
      title: 'Virtual Tour - Modern Farmhouse',
      description: 'Take a virtual tour of our stunning modern farmhouse design',
      videoUrl: '/videos/modern-farmhouse-tour.mp4'
    },
    {
      id: 2,
      title: 'Design Process',
      description: 'See how we bring your dream home to life',
      videoUrl: '/videos/design-process.mp4'
    },
    {
      id: 3,
      title: 'Client Testimonial',
      description: 'Hear from our satisfied clients about their experience',
      videoUrl: '/videos/client-testimonial.mp4'
    }
  ];

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Our Portfolio
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Explore our collection of custom home designs
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={() => setActiveTab('photos')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'photos'
                ? 'bg-primary-600 text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Photo Gallery
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'videos'
                ? 'bg-primary-600 text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Video Gallery
          </button>
        </div>

        {/* Photo Gallery */}
        {activeTab === 'photos' && (
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative">
                <div className="relative h-80 w-full overflow-hidden rounded-lg bg-white sm:aspect-h-1 sm:aspect-w-2 lg:aspect-h-1 lg:aspect-w-1 group-hover:opacity-75 sm:h-auto">
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    className="h-full w-full object-cover object-center"
                  />
                </div>
                <h3 className="mt-6 text-sm text-gray-500">
                  <span className="absolute inset-0" />
                  {photo.title}
                </h3>
                <p className="text-base font-semibold text-gray-900">{photo.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Video Gallery */}
        {activeTab === 'videos' && (
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <div key={video.id} className="group relative">
                <div className="relative h-80 w-full overflow-hidden rounded-lg bg-white sm:aspect-h-1 sm:aspect-w-2 lg:aspect-h-1 lg:aspect-w-1 group-hover:opacity-75 sm:h-auto">
                  <video
                    src={video.videoUrl}
                    controls
                    className="h-full w-full object-cover object-center"
                  />
                </div>
                <h3 className="mt-6 text-sm text-gray-500">
                  <span className="absolute inset-0" />
                  {video.title}
                </h3>
                <p className="text-base font-semibold text-gray-900">{video.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery; 