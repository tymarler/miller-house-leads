import React, { useState } from 'react';

const PhotoGallery = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Projects' },
    { id: 'custom', name: 'Custom Homes' },
    { id: 'renovation', name: 'Renovations' },
    { id: 'interior', name: 'Interior Design' }
  ];

  const projects = [
    {
      id: 1,
      title: 'Modern Farmhouse Design',
      category: 'custom',
      images: [
        'https://www.designtexasstudios.com/images/modern-farmhouse-1.jpg',
        'https://www.designtexasstudios.com/images/modern-farmhouse-2.jpg',
        'https://www.designtexasstudios.com/images/modern-farmhouse-3.jpg'
      ]
    },
    {
      id: 2,
      title: 'Contemporary Living Space',
      category: 'interior',
      images: [
        'https://www.designtexasstudios.com/images/contemporary-1.jpg',
        'https://www.designtexasstudios.com/images/contemporary-2.jpg',
        'https://www.designtexasstudios.com/images/contemporary-3.jpg'
      ]
    },
    {
      id: 3,
      title: 'Historic Home Renovation',
      category: 'renovation',
      images: [
        'https://www.designtexasstudios.com/images/renovation-1.jpg',
        'https://www.designtexasstudios.com/images/renovation-2.jpg',
        'https://www.designtexasstudios.com/images/renovation-3.jpg'
      ]
    }
  ];

  const filteredProjects = selectedCategory === 'all' 
    ? projects 
    : projects.filter(project => project.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Our Projects
        </h2>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
          Explore our portfolio of custom home designs and renovations
        </p>
      </div>

      <div className="mt-12">
        <div className="flex justify-center space-x-4 mb-8">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-md ${
                selectedCategory === category.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map(project => (
            <div key={project.id} className="group relative">
              <div className="relative w-full h-80 bg-gray-200 rounded-lg overflow-hidden group-hover:opacity-75">
                <img
                  src={project.images[0]}
                  alt={project.title}
                  className="w-full h-full object-cover"
                  onClick={() => setSelectedImage(project)}
                />
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">{project.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {selectedImage.title}
                    </h3>
                    <div className="mt-4">
                      <div className="grid grid-cols-3 gap-4">
                        {selectedImage.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`${selectedImage.title} - View ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setSelectedImage(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery; 