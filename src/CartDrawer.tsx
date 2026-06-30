import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';

interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-body">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface border-l border-outline-variant/50 flex flex-col shadow-2xl relative">
          
          {/* Header */}
          <div className="px-6 py-6 border-b border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <ShoppingBag size={20} />
              <span className="font-display text-headline-md tracking-wider uppercase">Your Cart</span>
            </div>
            <button 
              onClick={onClose}
              className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer p-1"
              aria-label="Close cart"
            >
              <X size={20} />
            </button>
          </div>

          {/* Cart List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-on-surface-variant">
                  <ShoppingBag size={28} />
                </div>
                <h3 className="font-display text-headline-md text-on-surface uppercase tracking-wide">Your cart is empty</h3>
                <p className="text-xs text-on-surface-variant max-w-xs">
                  Browse the shop section to add professional LUTs and presets to your cinematography collection.
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-primary text-primary font-mono text-xs uppercase tracking-widest hover:bg-primary/10 transition-all cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center gap-4 bg-surface-container-low p-4 border border-outline-variant/20 relative"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 bg-black overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>

                  {/* Details */}
                  <div className="flex-grow min-w-0">
                    <h4 className="text-xs font-semibold text-on-surface truncate pr-6">{item.title}</h4>
                    <p className="text-xs font-mono text-secondary mt-1 font-semibold">${item.price}</p>
                    
                    {/* Quantity Control */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-6 h-6 border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-all cursor-pointer"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-xs font-mono font-bold w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-all cursor-pointer"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="absolute top-4 right-4 text-outline hover:text-error transition-colors cursor-pointer"
                    aria-label="Remove item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer / Total */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-outline-variant/30 bg-surface-container-low space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant uppercase font-mono tracking-wider">Subtotal</span>
                <span className="font-mono text-primary font-bold text-lg">${total.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-on-surface-variant leading-normal">
                Tax and shipping calculated at checkout. Powered by secure payment infrastructure.
              </p>
              <button
                onClick={() => alert("Proceeding to secure checkout integration...")}
                className="w-full bg-primary text-on-primary py-4 font-display text-headline-md tracking-wider uppercase hover:bg-primary-container transition-all cursor-pointer text-center font-semibold"
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
