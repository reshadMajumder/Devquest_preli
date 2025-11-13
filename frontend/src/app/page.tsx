"use client"; // Add this directive for client-side component

import { Button } from '@/components/ui/button';
import  Header  from '@/components/layout/Header';
import { ArrowRight, Bot, ShieldCheck, Video, ArrowDown, FileText } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react'; // Import useState and useEffect
import { useRouter } from 'next/navigation'; // Import useRouter

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check login status on component mount
    const accessToken = localStorage.getItem('access_token');
    setIsLoggedIn(!!accessToken);

    // Listen for changes in localStorage (e.g., from login/logout actions)
    const handleStorageChange = () => {
      const updatedAccessToken = localStorage.getItem('access_token');
      setIsLoggedIn(!!updatedAccessToken);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleStartExamClick = (e: React.MouseEvent) => {
    if (!isLoggedIn) {
      e.preventDefault(); // Prevent default Link behavior
      router.push('/login'); // Redirect to login if not logged in
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1">
        <section id="home" className="h-screen flex flex-col justify-center items-center text-center relative">
          <div className="mx-auto max-w-3xl px-4">
            <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl font-headline">
              Welcome to Self_Made_Dev <br></br> Exam Portal
            </h1>
            <p className="mt-6 text-lg leading-8 text-foreground/80">
              An advanced online examination platform with AI-powered proctoring to ensure integrity and fairness.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button asChild size="lg">
                <Link href={isLoggedIn ? "/exam" : "/login"} onClick={handleStartExamClick}> 
                  {isLoggedIn ? "Start Your Secure Exam" : "Login to Start Exam"} <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="absolute bottom-10 animate-bounce">
            <a href="#how-it-works" aria-label="Scroll to how it works section">
              <ArrowDown className="h-8 w-8 text-primary" />
            </a>
          </div>
        </section>

        <section id="how-it-works" className="h-screen flex flex-col justify-center container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary font-headline">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              Our platform uses state-of-the-art technology to provide a seamless and secure testing experience.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">Secure Environment</h3>
              <p className="mt-2 text-muted-foreground">
                Your exam session is locked and monitored to prevent unauthorized activities.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Video className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">Live Proctoring</h3>
              <p className="mt-2 text-muted-foreground">
                Your camera and microphone are used to monitor the exam session for any irregularities.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">AI-Powered Analysis</h3>
              <p className="mt-2 text-muted-foreground">
                Our AI analyzes the recording for suspicious behavior and provides a detailed report.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">Instant Results</h3>
              <p className="mt-2 text-muted-foreground">
                Get your score and a detailed report immediately after completing the exam.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}