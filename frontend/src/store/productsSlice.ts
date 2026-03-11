import {createSlice, type PayloadAction} from "@reduxjs/toolkit";

export type Product = {
  id: string;
  title: string;
  variant: string;
  size: string;
  price: number;
  quantity?: number;
  fileUrl?: string;
};

interface ProductsState {
  items: Product[];
}

const loadState = (): Product[] => {
  try {
    const serializedState = localStorage.getItem("cart");
    if (serializedState === null) {
      return [];
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return [];
  }
};

const initialState: ProductsState = {
  items: loadState(),
};

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    addProduct: (
      state,
      action: PayloadAction<Omit<Product, "id" | "quantity">>,
    ) => {
      const product = action.payload;
      state.items.push({
        ...product,
        id: crypto.randomUUID(),
        quantity: 1,
      });
      // Save to localStorage
      localStorage.setItem("cart", JSON.stringify(state.items));
    },
    removeProduct: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      // Save to localStorage
      localStorage.setItem("cart", JSON.stringify(state.items));
    },
    setQuantity: (
      state,
      action: PayloadAction<{id: string; quantity: number}>,
    ) => {
      const {id, quantity} = action.payload;
      const index = state.items.findIndex((item) => item.id === id);

      if (index !== -1) {
        if (quantity <= 0) {
          state.items.splice(index, 1);
        } else {
          state.items[index].quantity = quantity;
        }
      }
      // Save to localStorage
      localStorage.setItem("cart", JSON.stringify(state.items));
    },
    updateProductFile: (
      state,
      action: PayloadAction<{id: string; fileUrl: string}>,
    ) => {
      const {id, fileUrl} = action.payload;
      const product = state.items.find((item) => item.id === id);
      if (product) {
        product.fileUrl = fileUrl;
      }
      // Save to localStorage
      localStorage.setItem("cart", JSON.stringify(state.items));
    },
  },
});

export const {addProduct, removeProduct, setQuantity, updateProductFile} =
  productsSlice.actions;
export default productsSlice.reducer;
