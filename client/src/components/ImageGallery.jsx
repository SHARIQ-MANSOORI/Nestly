import React, { useState } from 'react';

const ImageGallery = ({ images = [] }) => {
  const [selectedImage, setSelectedImage] = useState(
    images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1200'
  );

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-80 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-400">
        No images available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Hero Featured Image */}
      <div className="relative aspect-[16/9] md:aspect-[21/9] w-full rounded-2xl overflow-hidden bg-slate-100 shadow-md">
        <img
          src={selectedImage}
          alt="Hotel preview"
          className="w-full h-full object-cover transition-opacity duration-300"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
          {images.map((imgUrl, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(imgUrl)}
              className={`relative w-24 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                selectedImage === imgUrl ? 'border-blue-600 ring-2 ring-blue-600/30 scale-95' : 'border-transparent opacity-75 hover:opacity-100'
              }`}
            >
              <img
                src={imgUrl}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
