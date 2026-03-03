import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";

export type Product = {
  id: string;
  title: string;
  variant: string;
  size: string;
  price: number;
  quantity?: number;
  fileUrl?: string;
};

type ProductsContextType = {
  products: Product[];
  addProduct: (product: Omit<Product, "quantity">) => void;
  removeProduct: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
};

type ProductsProviderProps = {
  children: ReactNode;
};

const ProductsContext = createContext<ProductsContextType | undefined>(
  undefined
);

export type ProductsAction =
  | {type: "ADD_PRODUCT"; product: Omit<Product, "quantity">}
  | {type: "REMOVE_PRODUCT"; id: string}
  | {type: "SET_QUANTITY"; id: string; quantity: number};

function productsReducer(state: Product[], action: ProductsAction): Product[] {
  switch (action.type) {
    case "ADD_PRODUCT": {
      const p = action.product;
      const idx = state.findIndex((s) => s.id === p.id);
      if (idx === -1) {
        return [...state, {...p, quantity: 1}];
      }
      const next = state.slice();
      next[idx] = {...next[idx], quantity: (next[idx].quantity || 0) + 1};
      return next;
    }

    case "REMOVE_PRODUCT": {
      return state.filter((p) => p.id !== action.id);
    }

    case "SET_QUANTITY": {
      const idx = state.findIndex((p) => p.id === action.id);
      if (idx === -1) return state;
      const next = state.slice();
      if (action.quantity <= 0) {
        next.splice(idx, 1);
      } else {
        next[idx] = {...next[idx], quantity: action.quantity};
      }
      return next;
    }

    default:
      return state;
  }
}

export function ProductsProvider({children}: ProductsProviderProps) {
  const [products, dispatch] = useReducer(productsReducer, [], () => {
    const stored = localStorage.getItem("cart");
    return stored ? JSON.parse(stored) : [];
  });
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(products));
  }, [products]);

  const addProduct = (product: Omit<Product, "quantity">) => {
    dispatch({type: "ADD_PRODUCT", product});
  };

  const removeProduct = (id: string) => {
    dispatch({type: "REMOVE_PRODUCT", id});
  };

  const setQuantity = (id: string, quantity: number) => {
    dispatch({type: "SET_QUANTITY", id, quantity});
  };

  return (
    <ProductsContext.Provider
      value={{products, addProduct, removeProduct, setQuantity}}>
      {children}
    </ProductsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProducts() {
  const context = useContext(ProductsContext);

  if (!context) {
    throw new Error("useProducts must be used inside ProductsProvider");
  }

  return context;
}

export default ProductsContext;
