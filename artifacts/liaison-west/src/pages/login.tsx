import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useLoginUser, useRegisterUser } from "@workspace/api-client-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
});

export default function Login() {
  const [activeTab, setActiveTab] = useState("login");
  const [, setLocation] = useLocation();
  const { login: authenticateUser } = useAuth();
  
  const loginMutation = useLoginUser({
    mutation: {
      onSuccess: (data) => {
        authenticateUser(data.token, data.user);
        toast.success("Welcome back to Liaison West");
        setLocation("/account");
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to login. Please check your credentials.");
      }
    }
  });

  const registerMutation = useRegisterUser({
    mutation: {
      onSuccess: (data) => {
        authenticateUser(data.token, data.user);
        toast.success("Account created successfully");
        setLocation("/account");
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to register. Please try again.");
      }
    }
  });

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", phone: "" },
  });

  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data: values });
  };

  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate({ data: values });
  };

  return (
    <Layout>
      <div className="flex-1 flex min-h-[calc(100vh-4rem)]">
        {/* Left Side - Visual */}
        <div className="hidden lg:flex w-1/2 relative bg-muted items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-black/60 z-10 backdrop-blur-[2px]"></div>
          <img 
            src="https://images.unsplash.com/photo-1614200179396-2bdb77ebf81b?q=80&w=2000" 
            alt="Luxury Car Interior" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="relative z-20 p-12 max-w-lg text-white">
            <div className="bg-white/10 p-3 rounded-lg inline-block mb-6 backdrop-blur-md border border-white/20">
              <Car className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-serif font-bold mb-4">Your personal automotive concierge awaits.</h1>
            <p className="text-lg text-white/80 leading-relaxed">
              Create an account to save your favorite vehicles, manage financing applications, and complete your premium vehicle acquisition.
            </p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-serif font-bold text-white tracking-tight">Welcome</h2>
              <p className="text-muted-foreground mt-2">Sign in to your Liaison West account</p>
            </div>

            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/5 border border-white/10 rounded-lg p-1">
                <TabsTrigger value="login" className="rounded-md data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all">Sign In</TabsTrigger>
                <TabsTrigger value="register" className="rounded-md data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all">Create Account</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80">Email</FormLabel>
                          <FormControl>
                            <Input placeholder="name@example.com" className="bg-white/5 border-white/10 h-12" {...field} />
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
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-white/80">Password</FormLabel>
                            <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
                          </div>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" className="bg-white/5 border-white/10 h-12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base font-medium mt-2" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80">Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" className="bg-white/5 border-white/10 h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80">Email</FormLabel>
                          <FormControl>
                            <Input placeholder="name@example.com" className="bg-white/5 border-white/10 h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80">Phone Number (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 000-0000" className="bg-white/5 border-white/10 h-11" {...field} />
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
                          <FormLabel className="text-white/80">Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" className="bg-white/5 border-white/10 h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base font-medium mt-4" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}
