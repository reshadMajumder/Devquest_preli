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

function ResetPasswordForm() {
  const searchParams = useSearchParams(); // Initialize useSearchParams
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: "Email is required.",
      });
      return;
    }

    if (password !== password2) {
      toast({
        variant: "destructive",
        title: "Password Mismatch",
        description: "New passwords do not match.",
      });
      return;
    }

    const response = await authApi.resetPassword({ email, otp, password });

    if (response.success) {
      toast({
        title: "Password Reset Successful",
        description: response.message,
      });
      router.push('/login'); // Redirect to login page after successful password reset
    } else {
      toast({
        variant: "destructive",
        title: "Password Reset Failed",
        description: response.error,
      });
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center py-12 px-4">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Enter the OTP and your new password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@diu.edu.bd" required value={email} onChange={(e) => setEmail(e.target.value)} readOnly={isEmailPreFilled} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp">OTP</Label>
              <Input id="otp" type="text" placeholder="XXXXXX" required value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password2">Confirm New Password</Label>
              <Input id="password2" type="password" required value={password2} onChange={(e) => setPassword2(e.target.value)} />
            </div>
            <Button type="submit" className="w-full text-white bg-[#30475f] hover:bg-[#006298] shadow-sm hover:shadow-md transition-all duration-300">Reset Password</Button>
          </form>
          <div className="flex justify-end text-sm">
            <Link href="/login" className="text-primary hover:underline">Back to Login</Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div>Loading reset password form...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
