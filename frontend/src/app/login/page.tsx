"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Added this import
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from '@/components/layout/Header'; // Add Header import
import { useToast } from "@/hooks/use-toast";
import { authApi } from '@/lib/api'; // Import authApi
import { Eye, EyeOff } from 'lucide-react';

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.56-3.108-11.28-7.481l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 35.24 44 30.022 44 24c0-1.341-.138-2.65-.389-3.917z" />
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [studentId, setStudentId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const validateEmail = (email: string) => {
    if (!email.endsWith('@diu.edu.bd')) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please use an email with the @diu.edu.bd extension.",
      });
      return false;
    }
    return true;
  };

  const handleGoogleLogin = () => {
    // Handle Google login logic here
    console.log('Logging in with Google');
    // For now, let's assume Google login is successful and redirect
    router.push('/exam');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) return;

    const response = await authApi.login({ email, password });

    if (response.success && response.data) {
      localStorage.setItem('access_token', response.data.access || '');
      localStorage.setItem('refresh_token', response.data.refresh || '');
      toast({
        variant: "success",
        title: "Login Successful",
        description: response.data.message,
      });
      router.push('/exam'); // Redirect to exam page after successful login
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: response.error,
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) return;

    const response = await authApi.register({ email, full_name: fullName, whatsapp_number: whatsappNumber, student_id: studentId, password, password2: password });

    if (response.success && response.data) {
      toast({
        variant: "success",
        title: "Registration Successful",
        description: response.data.message + " Please verify your email with the OTP.",
      });
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`); 
    } else {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: response.error,
      });
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Tabs defaultValue="login" className="w-[400px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>
                  Welcome back! Please enter your details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="m@diu.edu.bd" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input id="login-password" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end text-sm">
                    <Link href="/forgot-password" className="text-primary hover:underline">Forgot Password?</Link>
                  </div>
                  <Button type="submit" className="w-full text-white bg-[#30475f] hover:bg-[#006298] shadow-sm hover:shadow-md transition-all duration-300">Login</Button>
                </form>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
                  <GoogleIcon />
                  Sign in with Google
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Register</CardTitle>
                <CardDescription>
                  Create an account to get started.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-full-name">Full Name</Label>
                    <Input id="register-full-name" type="text" placeholder="John Doe" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-whatsapp-number">WhatsApp Number</Label>
                    <Input id="register-whatsapp-number" type="text" placeholder="e.g., +8801XXXXXXXXX" required value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-student-id">Student ID</Label>
                    <Input id="register-student-id" type="text" placeholder="e.g., 202XXXXXXX" required value={studentId} onChange={(e) => setStudentId(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input id="register-email" type="email" placeholder="m@diu.edu.bd" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <div className="relative">
                      <Input id="register-password" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full text-white bg-[#30475f] hover:bg-[#006298] shadow-sm hover:shadow-md transition-all duration-300">Create Account</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}