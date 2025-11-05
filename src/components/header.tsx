'use client';

import Logo from './logo';
import { ThemeToggle } from './theme-toggle';
import { UserNav } from './user-nav';
import { useUser } from '@/firebase';
import Link from 'next/link';
import { Button } from './ui/button';

export function Header() {
  const { user, isUserLoading } = useUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex items-center">
          <Logo />
          <Link href="/" className="ml-2 font-headline text-lg font-bold">
            Refract AI
          </Link>
        </div>

        <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
          <Link
              href="/contact"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Contact
            </Link>
        </nav>


        <div className="flex flex-1 items-center justify-end space-x-2">
          {isUserLoading ? null : user ? (
            <UserNav />
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
