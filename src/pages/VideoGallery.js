import React from 'react';

const VideoGallery = () => {
  const videos = [
    {
      id: 1,
      title: 'Modern Farmhouse Design Process',
      description: 'Watch our team transform a traditional farmhouse into a modern masterpiece with sustainable materials and innovative design solutions.',
      videoUrl: 'https://www.youtube.com/embed/y5zMzfms2S0'
    },
    {
      id: 2,
      title: 'Interior Design Transformation',
      description: 'See how we revitalized a contemporary living space with custom furniture, lighting, and artistic elements.',
      videoUrl: 'https://www.youtube.com/embed/Vd9h3dly0X0'
    },
    {
      id: 3,
      title: 'Historic Home Renovation',
      description: 'Follow the journey of restoring a historic home while preserving its character and adding modern amenities.',
      videoUrl: 'https://www.youtube.com/embed/D-H6jLrpNX8'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Video Gallery</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {videos.map((video) => (
          <div key={video.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="aspect-w-16 aspect-h-9">
              <iframe
                src={video.videoUrl}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{video.title}</h2>
              <p className="text-gray-600">{video.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoGallery; 