"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Import useSearchParams
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from '@/components/layout/Header';
import { useToast } from "@/hooks/use-toast";
import { authApi } from '@/lib/api';
import Link from 'next/link';

function VerifyOtpForm() {

  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');

  const [otp, setOtp] = useState('');

  const [isEmailPreFilled, setIsEmailPreFilled] = useState(false); // New state to track if email was pre-filled

  const { toast } = useToast();

  const router = useRouter();



  useEffect(() => {

    const emailFromQuery = searchParams.get('email');

    if (emailFromQuery) {

      setEmail(emailFromQuery);

      setIsEmailPreFilled(true); // Set to true if email came from query

    }

  }, [searchParams]);



  const handleVerifyOtp = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!email) {

      toast({

        variant: "destructive",

        title: "Verification Failed",

        description: "Email is required.",

      });

      return;

    }

    const response = await authApi.verifyOtp({ email, otp });



    if (response.success) {

      localStorage.setItem('access_token', response.access || '');

      localStorage.setItem('refresh_token', response.refresh || '');

      toast({

        title: "Verification Successful",

        description: response.message,

      });

      router.push('/exam'); // Redirect to exam page after successful verification

    } else {

      toast({

        variant: "destructive",

        title: "Verification Failed",

        description: response.error,

      });

    }

  };



  const handleResendOtp = async () => {

    if (!email) {

      toast({

        variant: "destructive",

        title: "Resend Failed",

        description: "Please enter your email to resend OTP.",

      });

      return;

    }

    const response = await authApi.resendOtp({ email });

    if (response.success) {

      toast({

        title: "OTP Resent",

        description: response.message,

      });

    } else {

      toast({

        variant: "destructive",

        title: "Resend Failed",

        description: response.error,

      });

    }

  };



  return (

    <main className="flex-1 flex items-center justify-center py-12 px-4">

      <Card className="w-[400px]">

        <CardHeader>

          <CardTitle>Verify Your Email</CardTitle>

          <CardDescription>

            Enter the OTP sent to your email address.

          </CardDescription>

        </CardHeader>

        <CardContent className="space-y-4">

          <form onSubmit={handleVerifyOtp} className="space-y-4">

            <div className="space-y-2">

              <Label htmlFor="email">Email</Label>

              <Input id="email" type="email" placeholder="m@diu.edu.bd" required value={email} onChange={(e) => setEmail(e.target.value)} readOnly={!!email} />

            </div>

            <div className="space-y-2">

              <Label htmlFor="otp">OTP</Label>

              <Input id="otp" type="text" placeholder="XXXXXX" required value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} />

            </div>

            <Button type="submit" className="w-full text-white bg-[#30475f] hover:bg-[#006298] shadow-sm hover:shadow-md transition-all duration-300">Verify Email</Button>

          </form>

          <div className="flex justify-between text-sm">

            <Button variant="link" onClick={handleResendOtp} className="p-0 h-auto">Resend OTP</Button>

            <Link href="/login" className="text-primary hover:underline">Back to Login</Link>

          </div>

        </CardContent>

      </Card>

    </main>

  );

}



export default function VerifyOtpPage() {

  return (

    <>

      <Header />

      <Suspense fallback={<div>Loading OTP verification form...</div>}>

        <VerifyOtpForm />

      </Suspense>

    </>

  );

}