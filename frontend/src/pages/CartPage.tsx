import {useProducts} from "../context/ProductsContext";

export type Product = {
  id: string;
  title: string;
  variant: string;
  size: string;
  price: number; // unit price
  quantity: number;
  fileUrl?: string;
};

export function CartPage() {
  const {products, removeProduct, setQuantity} = useProducts();

  return (
    <>
      {/* Page Header */}
      <header
        className="
          text-center p-6 sm:p-8 lg:p-12
          lg:ml-[20%]
        ">
        <h1 className="text-4xl sm:text-5xl font-bold">Cart</h1>
        <p className="text-sm sm:text-base">Check out your cart here!</p>
      </header>

      {/* Main Content */}
      <main
        className="
          min-h-screen
          p-4 sm:p-6 lg:p-12
          lg:ml-[20%]
          transition-all
        ">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-225 text-xl">
            <thead>
              <tr className="border-b">
                <th className="py-2">Product</th>
                <th className="py-2">Variant</th>
                <th className="py-2">Size</th>
                <th className="py-2">Unit Price</th>
                <th className="py-2">Quantity</th>
                <th className="py-2">Initial Price</th>
                <th className="py-2">File</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>

            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-gray-500">
                    Your cart is empty
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const qty = p.quantity || 1;
                  const initialPrice = p.price * qty;

                  return (
                    <tr key={p.id}>
                      <td className="py-2">{p.title}</td>
                      <td className="py-2">{p.variant}</td>
                      <td className="py-2">{p.size}</td>
                      <td className="py-2">₱{p.price}.00</td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <input
                            value={qty}
                            onChange={(e) => {
                              const val = Number(e.target.value || 0);
                              if (!Number.isNaN(val))
                                setQuantity(p.id, Math.max(0, Math.floor(val)));
                            }}
                            type="number"
                            className="w-16 text-center border border-gray-200 rounded px-2 py-1"
                          />
                        </div>
                      </td>
                      <td className="py-2 font-semibold">₱{initialPrice}.00</td>
                      <td className="py-2">
                        {p.fileUrl ? (
                          <a
                            href={p.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 font-semibold hover:underline">
                            Uploaded
                          </a>
                        ) : (
                          <span className="text-red-500 font-light">
                            Missing
                          </span>
                        )}
                      </td>
                      <td className="py-2">
                        <button
                          onClick={() => removeProduct(p.id)}
                          className="text-red-500 hover:text-red-700 cursor-pointer">
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Page Footer */}
      <footer
        className="
          p-6 text-center text-sm text-gray-500
          lg:ml-[20%]
        ">
        © 2026 Your Store
      </footer>
    </>
  );
}
