"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@prisma/client';
import { UserMenu } from './UserMenu';
import { Button } from '@/components/ui/button';
import { SearchDialog } from '@/components/search/SearchDialog';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/store", label: "Store" },
  { href: "/products", label: "Products" },
  { href: "/contact", label: "Contact Us" },
] as const;

interface NavLinksProps {
  pathname: string;
}

function NavLinks({ pathname }: NavLinksProps) {
  return (
    <>
      {navigation.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`text-sm ${(item.href === '/' && pathname === '/') ||
            (item.href === '/store' && pathname === '/store') ||
            (item.href !== '/' && item.href !== '/store' && pathname.startsWith(item.href))
            ? 'text-gray-900'
            : 'text-gray-500 hover:text-gray-900'
            }`}
        >
          {item.label}
        </Link>
      ))}
    </>
  );
}

interface MainNavProps {
  user: User | null;
}

export function MainNav({ user }: MainNavProps) {
  const pathname = usePathname();

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <SheetTitle>Navigation Menu</SheetTitle>
                  <SheetDescription className="sr-only">
                    Access all pages from our website
                  </SheetDescription>
                </div>
                <nav className="flex flex-col gap-4">
                  <NavLinks pathname={pathname} />
                  {!user && (
                    <div className="flex flex-col gap-2 pt-4 border-t md:hidden">
                      <Button asChild variant="outline">
                        <Link href="/login">Login</Link>
                      </Button>
                      <Button asChild>
                        <Link href="/register">Register</Link>
                      </Button>
                    </div>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/store" className="text-xl font-bold">
            Matjary
          </Link>

          <nav className="hidden gap-4 md:flex">
            <NavLinks pathname={pathname} />
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <SearchDialog />
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden md:inline-flex">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="hidden md:inline-flex">
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
} 