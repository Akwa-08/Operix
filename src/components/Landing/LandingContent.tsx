import Modal from "../UserModal/SideBar";
export const LandingContent = () => {
  return (
    <div className="bg-linear-to-br from-violet-50 via-purple-50 to-pink-50 min-h-screen">
      <Modal name="Landing" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-6 text-center lg:text-left order-2 lg:order-1">
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-pink-600">
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

            {/* Optional CTA Button */}
            <div className="pt-4">
              <button className="bg-linear-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                Explore Our Services
              </button>
            </div>
          </div>

          {/* Right Column - Pictures */}
          <div className="flex items-center justify-center order-1 lg:order-2">
            <div className="w-full max-w-md lg:max-w-lg">
              {/* Placeholder for image */}
              <div className="aspect-square  flex items-center justify-center">
                <p className="text-lg text-gray-600">Pictures</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
