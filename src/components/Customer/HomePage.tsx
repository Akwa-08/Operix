import {useState} from "react";
import {Search, ShoppingCart, ChevronLeft, ChevronRight} from "lucide-react";
import {useProducts} from "../../context/ProductsContext";
import products from "../../util/Products";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const productCtx = useProducts();

  const handleAddToCart = (product: (typeof products)[number]) => {
    productCtx.addProduct({...product, id: String(product.id)});
    console.log("Product added to cart:", product);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl ml-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">Homepage</h1>
          <p className="text-gray-500 text-lg">Welcome back, John!</p>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          {/* Products Header with Search */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Products</h2>

            {/* Search Bar */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-100 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {products.map((product) => (
              <div
                key={product.id}
                className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {product.title}
                </h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Variant:</span>
                    <span className="text-gray-700 text-sm font-medium">
                      {product.variant}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Unit Price:</span>
                    <span className="text-gray-900 font-bold">
                      ₱{product.price}.00
                    </span>
                  </div>

                  <div className="pt-2">
                    <span className="text-gray-500 text-sm block mb-1">
                      Size:
                    </span>
                    <span className="text-gray-700 text-sm font-medium">
                      {product.size}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleAddToCart(product)}
                  className="w-full bg-cyan-400 hover:bg-cyan-500 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors duration-300 cursor-pointer">
                  Add to Cart
                  <ShoppingCart className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={currentPage === 1}>
              <ChevronLeft className="w-6 h-6" />
            </button>

            <span className="text-2xl font-bold text-gray-900">
              {currentPage}
            </span>

            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
