"use client";

import Link from 'next/link';
import { ShieldCheck, User, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { authApi } from '@/lib/api'; // Import authApi
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const isHomePage = pathname === '/';
  const isExamPage = pathname === '/exam';
  const [activeLink, setActiveLink] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check login status on component mount and when localStorage changes
    const checkLoginStatus = () => {
      const accessToken = localStorage.getItem('access_token');
      setIsLoggedIn(!!accessToken);
    };

    checkLoginStatus(); // Initial check

    // Listen for changes in localStorage (e.g., from login/logout actions)
    window.addEventListener('storage', checkLoginStatus);
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const howItWorksSection = document.getElementById('how-it-works');
      
      const scrollPosition = window.scrollY + 100;

      if (howItWorksSection && scrollPosition >= howItWorksSection.offsetTop) {
        setActiveLink('how-it-works');
      } else {
        setActiveLink('home');
      }
    };

    if (isHomePage) {
      window.addEventListener('scroll', handleScroll);
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isHomePage]);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      const response = await authApi.logout({ refresh_token: refreshToken });
      if (response.success) {
        toast({
          title: "Logout Successful",
          description: response.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Logout Failed",
          description: response.error,
        });
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsLoggedIn(false);
    router.push('/login'); // Redirect to login page after logout
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="text-lg font-headline">SMD exam portal</span>
        </Link>
        
        <div className="flex items-center gap-8">
          {isHomePage && (
            <nav className="hidden md:flex gap-8">
              <a 
                href="#" 
                onClick={() => setActiveLink('home')}
                className={cn(
                  "text-sm font-medium transition-all duration-300 hover:text-primary transform hover:-translate-y-1 hover:text-shadow-md",
                  activeLink === 'home' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
                )}
              >
                Home
              </a>
              <a 
                href="#how-it-works" 
                onClick={() => setActiveLink('how-it-works')}
                className={cn(
                  "text-sm font-medium transition-all duration-300 hover:text-primary transform hover:-translate-y-1 hover:text-shadow-md",
                  activeLink === 'how-it-works' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
                )}
              >
                How It Works
              </a>
            </nav>
          )}

          {!isExamPage && (
            isLoggedIn ? (
              <Button onClick={handleLogout} className="text-white bg-[#30475f] hover:bg-[#2a3f55] shadow-sm hover:shadow-md transition-all duration-300">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            ) : (
              <Button asChild className="text-white bg-[#30475f] hover:bg-[#2a3f55] shadow-sm hover:shadow-md transition-all duration-300">
                <Link href="/login">
                  <User className="mr-2 h-4 w-4" />
                  Login
                </Link>
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
