import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useLoginAgent } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Briefcase } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function AgentLogin() {
  const [, setLocation] = useLocation();
  const { login: authenticateUser } = useAuth();
  
  const loginMutation = useLoginAgent({
    mutation: {
      onSuccess: (data) => {
        authenticateUser(data.token, data.user);
        toast.success("Welcome to the Agent Portal");
        setLocation("/agent/dashboard");
      },
      onError: (error: any) => {
        toast.error(error.message || "Authentication failed. Check your credentials.");
      }
    }
  });

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data: values });
  };

  return (
    <Layout>
      <div className="flex-1 flex min-h-[calc(100vh-4rem)] bg-background">
        <div className="w-full flex items-center justify-center p-8 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sidebar-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="w-full max-w-md space-y-8 relative z-10 bg-card/50 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl">
            <div className="text-center">
              <div className="mx-auto bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-serif font-bold text-white tracking-tight">Agent Portal</h2>
              <p className="text-muted-foreground mt-2">Authorized personnel only</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">Agent Email</FormLabel>
                      <FormControl>
                        <Input placeholder="agent@liaisonwest.com" className="bg-white/5 border-white/10 h-12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" className="bg-white/5 border-white/10 h-12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium mt-4 bg-white text-black hover:bg-white/90" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Authenticating..." : "Access Portal"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
