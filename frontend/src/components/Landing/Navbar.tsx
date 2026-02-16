export const Navbar = () => {
  return (
    <div className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-7">
        <div className="flex justify-between items-center">
          <div className="text-xl font-bold">Operix</div>
          <nav className="space-x-10">
            <a href="#" className="font-bold text-gray-700 hover:opacity-75">
              Home
            </a>
            <a href="#" className="font-bold text-gray-700 hover:opacity-75">
              Products
            </a>
            <a href="#" className="font-bold text-gray-700 hover:opacity-75">
              Contact
            </a>
            <a href="#" className="font-bold text-gray-700 hover:opacity-75">
              About Us
            </a>
            <a
              href="#"
              className="font-bold text-white hover:opacity-75 bg-pink-600 px-4 py-2 rounded-lg">
              Order Now
            </a>
          </nav>
        </div>
      </div>
    </div>
  );
};
