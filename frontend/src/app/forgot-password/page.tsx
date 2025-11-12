"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from '@/components/layout/Header';
import { useToast } from "@/hooks/use-toast";
import { authApi } from '@/lib/api';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await authApi.forgotPassword({ email });

    if (response.success) {
      toast({
        title: "OTP Sent",
        description: response.message + " Please check your email for the password reset OTP.",
      });
      router.push(`/reset-password?email=${encodeURIComponent(email)}`); // Redirect to reset password page with email
    } else {
      toast({
        variant: "destructive",
        title: "Request Failed",
        description: response.error,
      });
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>
              Enter your email address to receive a password reset OTP.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@diu.edu.bd" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button type="submit" className="w-full text-white bg-[#30475f] hover:bg-[#006298] shadow-sm hover:shadow-md transition-all duration-300">Send OTP</Button>
            </form>
            <div className="flex justify-end text-sm">
              <Link href="/login" className="text-primary hover:underline">Back to Login</Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
