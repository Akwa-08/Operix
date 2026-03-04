import React from "react";
import Card from "./Card";
import { type Service, services } from "../../assets/MainContentText";

export const MainContent: React.FC = () => {
  return (
    <section
      id="products"
      className="py-16 lg:py-24 bg-gradient-to-b from-white to-violet-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-16 text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#AA00FD] to-[#E80088]">
            Our Services
          </h2>
          <p className="text-gray-700 text-lg sm:text-xl font-medium max-w-2xl mx-auto">
            Professional printing solutions for every need
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service: Service, index: number) => (
            <div
              key={index}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Card
                image={service.image}
                title={service.title}
                description={service.description}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};