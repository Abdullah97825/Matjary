import { CartSheet } from "@/components/cart/CartSheet";
import { MainNav } from "@/components/layout/MainNav";
import { getCurrentUser } from "@/lib/auth";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  
  return (
    <>
      <MainNav user={user} />
      {children}
      {user && <CartSheet />}
    </>
  );
}