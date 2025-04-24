import React from 'react';

const PhotoGallery = () => {
  return (
    <div className="bg-white min-h-screen font-sans">
      {/* Header */}
      <header className="py-8 px-4 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 uppercase">
          DESIGN TEXAS STUDIOS
        </h1>
        <p className="mt-2 text-xl text-gray-600">Home design</p>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Image Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image 1 */}
          <div className="relative overflow-hidden">
            <img 
              src="/images/design-texas/maxresdefault.jpg" 
              alt="Exterior View" 
              className="w-full h-96 object-cover transform transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
              <h3 className="text-xl font-semibold">Modern House Exterior</h3>
            </div>
          </div>

          {/* Image 2 */}
          <div className="relative overflow-hidden">
            <img 
              src="/images/design-texas/maxresdefault(1).jpg" 
              alt="Interior Design" 
              className="w-full h-96 object-cover transform transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
              <h3 className="text-xl font-semibold">Interior Design</h3>
            </div>
          </div>

          {/* Image 3 */}
          <div className="relative overflow-hidden">
            <img 
              src="/images/design-texas/d3f1bc_f7667e595af04087b07b35fdd2aca8fef000.jpg" 
              alt="Custom Design" 
              className="w-full h-96 object-cover transform transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
              <h3 className="text-xl font-semibold">Custom Design Project</h3>
            </div>
          </div>

          {/* Image 4 */}
          <div className="relative overflow-hidden">
            <img 
              src="/images/design-texas/d3f1bc_82e8eab16f414c9bb7aba02e5a28d598f000.jpg" 
              alt="Architectural Detail" 
              className="w-full h-96 object-cover transform transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
              <h3 className="text-xl font-semibold">Architectural Detail</h3>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white py-8 px-4 text-center">
        <h3 className="text-xl font-semibold">Design Texas Studios</h3>
        <p className="mt-2 text-gray-600">jay@designtexasstudios.com</p>
        <p className="text-gray-600">©2023 by Design Texas Studios</p>
      </footer>
    </div>
  );
};

export default PhotoGallery; 