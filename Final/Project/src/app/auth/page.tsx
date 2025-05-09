'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context'; // Import useAuth

// Zod Schemas for validation (remain the same)
const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ['confirmPassword'],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { signIn } = useAuth(); // Get signIn function from context
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const handleLogin = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      // Use the signIn context method to handle profile fetch and progress merge
      await signIn(userCredential.user);
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      router.push('/'); // Redirect to home page
    } catch (error: any) {
      console.error("Login Error:", error);
      toast({
        title: 'Login Failed',
        description: error.message || 'Please check your credentials.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // The signIn method now handles profile creation/fetching and progress merging
      await signIn(user);

      // Note: Firestore user document creation is now handled within the `signIn` logic (in AuthProvider)
      // Check if progress needs creation (though signIn might handle this indirectly)
      const progressDocRef = doc(db, 'userProgress', user.uid);
      const progressSnap = await getDoc(progressDocRef);
      if (!progressSnap.exists()) {
          await setDoc(progressDocRef, {}); // Create empty progress doc if needed
      }

      toast({ title: 'Registration Successful', description: 'Welcome to Self-Learn!' });
      router.push('/'); // Redirect to home page
    } catch (error: any) {
      console.error("Registration Error:", error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'Could not create account.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

 const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // Use the signIn context method to handle profile fetch/creation and progress merge
      await signIn(result.user);

      // Ensure progress doc exists (similar check as in registration)
      const progressDocRef = doc(db, 'userProgress', result.user.uid);
      const progressSnap = await getDoc(progressDocRef);
      if (!progressSnap.exists()) {
          await setDoc(progressDocRef, {});
      }

      toast({ title: 'Signed in with Google', description: 'Welcome!' });
      router.push('/');
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      // Check for specific error codes if needed (e.g., account-exists-with-different-credential)
      toast({
        title: 'Google Sign-In Failed',
        description: error.message || 'Could not sign in with Google.',
        variant: 'destructive',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };


  return (
    // Centering and padding for responsiveness
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] py-8 sm:py-12 px-4">
      {/* Responsive Tabs width */}
      <Tabs defaultValue="login" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>

        {/* Login Tab */}
        <TabsContent value="login">
          <Card>
            <CardHeader className="px-4 pt-6 pb-4 sm:px-6">
              <CardTitle className="text-xl sm:text-2xl">Login</CardTitle>
              <CardDescription className="text-sm sm:text-base">Access your learning dashboard & saved progress.</CardDescription>
            </CardHeader>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)}>
                <CardContent className="space-y-4 px-4 sm:px-6">
                   {/* Social Login */}
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
                   <Button variant="outline" className="w-full" type="button" disabled={isLoading || isGoogleLoading} onClick={handleGoogleSignIn}>
                       {isGoogleLoading ? (
                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       ) : (
                          // Simple Google Icon Placeholder
                          <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
                       )}
                       Google
                   </Button>
                    {/* Separator */}
                    <div className="relative my-4">
                       <div className="absolute inset-0 flex items-center">
                           <span className="w-full border-t" />
                       </div>
                       <div className="relative flex justify-center text-xs uppercase">
                           <span className="bg-background px-2 text-muted-foreground">
                               Or with email
                           </span>
                       </div>
                   </div>

                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="m@example.com" {...field} disabled={isLoading}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} disabled={isLoading}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="px-4 pb-6 sm:px-6">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                     {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     Login
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

        {/* Register Tab */}
        <TabsContent value="register">
          <Card>
            <CardHeader className="px-4 pt-6 pb-4 sm:px-6">
              <CardTitle className="text-xl sm:text-2xl">Register</CardTitle>
              <CardDescription className="text-sm sm:text-base">Create an account to save progress & earn rewards.</CardDescription>
            </CardHeader>
             <Form {...registerForm}>
               <form onSubmit={registerForm.handleSubmit(handleRegister)}>
                 <CardContent className="space-y-4 px-4 sm:px-6">
                    {/* Social Login */}
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
                    <Button variant="outline" className="w-full" type="button" disabled={isLoading || isGoogleLoading} onClick={handleGoogleSignIn}>
                       {isGoogleLoading ? (
                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       ) : (
                           // Simple Google Icon Placeholder
                           <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
                       )}
                       Google
                   </Button>
                    {/* Separator */}
                    <div className="relative my-4">
                       <div className="absolute inset-0 flex items-center">
                           <span className="w-full border-t" />
                       </div>
                       <div className="relative flex justify-center text-xs uppercase">
                           <span className="bg-background px-2 text-muted-foreground">
                               Or with email
                           </span>
                       </div>
                   </div>

                   <FormField
                     control={registerForm.control}
                     name="email"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Email</FormLabel>
                         <FormControl>
                           <Input placeholder="m@example.com" {...field} disabled={isLoading}/>
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   <FormField
                     control={registerForm.control}
                     name="password"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Password</FormLabel>
                         <FormControl>
                           <Input type="password" placeholder="••••••••" {...field} disabled={isLoading}/>
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   <FormField
                     control={registerForm.control}
                     name="confirmPassword"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Confirm Password</FormLabel>
                         <FormControl>
                           <Input type="password" placeholder="••••••••" {...field} disabled={isLoading}/>
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                 </CardContent>
                 <CardFooter className="px-4 pb-6 sm:px-6">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                     {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     Register
                   </Button>
                 </CardFooter>
               </form>
             </Form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
