import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get(`/stock/${productId}`);

      const productStock: Stock = response.data;

      const productAlreadyAdded = cart.find(product => product.id === productId)

      const productAmount = productAlreadyAdded
        ? (productAlreadyAdded.amount + 1)
        : 1

      if (productStock.amount < productAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      let updatedCart: Product[] = [];


      if (productAlreadyAdded) {
        updatedCart = cart.map(product => {
          if (product.id === productId) {
            return product = {
              ...product,
              amount: product.amount + 1
            }
          };
          return product;
        })

        setCart(updatedCart)
      } else {
        const response = await api.get(`/products/${productId}`);

        const product: Product = response.data;

        updatedCart = [
          ...cart,
          {
            ...product,
            amount: 1
          }
        ]

        setCart(updatedCart);
      }

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na adi????o do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.find(product => product.id === productId);

      if (!productExists) {
        throw new Error("Produto n??o encontrado")
      }

      const updatedCart = cart.filter(product => product.id !== productId)

      setCart(updatedCart);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na remo????o do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) {
        throw new Error("Quantidade do produto n??o deve ser menor que zero")
      }

      const response = await api.get(`/stock/${productId}`);

      const productStock: Stock = response.data;

      if (productStock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCart = cart.map(product => {
        if (product.id === productId) {
          return {
            ...product,
            amount
          }
        }
        return product;
      });

      setCart(updatedCart);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart))
    } catch {
      toast.error('Erro na altera????o de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
