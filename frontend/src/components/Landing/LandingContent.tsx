import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const LandingContent = () => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Dummy images - replace with actual product images
  const productImages = [
    "/images/product1.jpg",
    "/images/product2.jpg",
    "/images/product3.jpg",
    "/images/product4.jpg",
    "/images/product5.jpg",
  ];

  // Fallback colors for when images don't load (CMYK theme)
  const fallbackColors = [
    "linear-gradient(135deg, #00BEF4 0%, #0099CC 100%)", // Cyan
    "linear-gradient(135deg, #E80088 0%, #C70070 100%)", // Magenta
    "linear-gradient(135deg, #FFD102 0%, #E6BC00 100%)", // Yellow
    "linear-gradient(135deg, #AA00FD 0%, #8800CC 100%)", // Purple
  ];

  // Auto-rotate images every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [productImages.length]);

  const handleOrderNow = () => {
    navigate("/signup");
  };

  return (
    <div
      id="home"
      className="bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 min-h-screen"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-6 text-center lg:text-left order-2 lg:order-1">
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#E80088]">
                VTA Link
              </h1>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900">
                Printing Services
              </h2>
            </div>

            <p className="text-lg sm:text-xl font-medium text-gray-800">
              Your One-Stop Shop for Custom Prints & More!
            </p>

            <p className="text-base sm:text-lg font-light text-gray-700 max-w-lg mx-auto lg:mx-0">
              From custom jerseys to professional signage, we deliver
              high-quality printing solutions for all your personal and business
              needs.
            </p>

            {/* Color Dots */}
            <div className="flex gap-4 justify-center lg:justify-start">
              <div className="w-8 h-8 rounded-full bg-[#00BEF4]"></div>
              <div className="w-8 h-8 rounded-full bg-[#E80088]"></div>
              <div className="w-8 h-8 rounded-full bg-[#FFD102]"></div>
              <div className="w-8 h-8 rounded-full bg-[#AA00FD]"></div>
            </div>

            {/* CTA Button - Now navigates to signup */}
            <div className="pt-4">
              <button
                onClick={handleOrderNow}
                className="bg-[#E80088] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#C70070] transform hover:scale-105 transition-all duration-300 shadow-lg"
              >
                Order Now
              </button>
            </div>
          </div>

          {/* Right Column - Image Carousel */}
          <div className="flex items-center justify-center order-1 lg:order-2">
            <div className="w-full max-w-md lg:max-w-lg">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl relative">
                {/* Image Carousel */}
                {productImages.map((image, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ${
                      index === currentImageIndex ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Product ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to gradient if image fails to load
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = "none";
                        if (target.parentElement) {
                          target.parentElement.style.background =
                            fallbackColors[index % fallbackColors.length];
                        }
                      }}
                    />
                  </div>
                ))}

                {/* Fallback - VTA Logo Diamond */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 rotate-45 border-8 border-white/20 rounded-3xl">
                    <div className="w-full h-full -rotate-45 flex items-center justify-center">
                      {/* Simplified arrow logo */}
                      <svg
                        viewBox="0 0 100 100"
                        className="w-40 h-40 opacity-30"
                        fill="white"
                      >
                        <polygon points="50,10 90,50 50,90 10,50" />
                        <polygon
                          points="50,25 70,50 50,75"
                          fill="#E80088"
                        />
                        <polygon
                          points="30,50 50,25 50,75"
                          fill="#00BEF4"
                        />
                        <polygon
                          points="50,25 70,50 50,50"
                          fill="#FFD102"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Carousel Indicators */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                  {productImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImageIndex
                          ? "bg-white w-6"
                          : "bg-white/50"
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};