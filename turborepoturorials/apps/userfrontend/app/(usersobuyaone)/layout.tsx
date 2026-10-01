import StoreLayoutWrapper from "./_components/StoreLayoutWrapper";
import CartProvider from "./_components/shop/CartProvider";
import WishlistProvider from "./_components/shop/WishlistProvider";

// Route group for the customer-facing store. The (parentheses) keep it out of the URL,
// so pages here are still served at /, /cart, /product/[id], etc.
export default function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <WishlistProvider>
      <CartProvider>
        <StoreLayoutWrapper>{children}</StoreLayoutWrapper>
      </CartProvider>
    </WishlistProvider>
  );
}
