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
import { Eye, EyeOff, ArrowRight, Shield, Zap, Star } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});

const registerSchema = z.object({
  name: z.string().min(2, "At least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
  phone: z.string().optional(),
});

const FEATURES = [
  { icon: Shield, label: "Bank-grade security on every transaction" },
  { icon: Zap, label: "Instant financing approvals in minutes" },
  { icon: Star, label: "Exclusive access to premium inventory" },
];

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPw, setShowPw] = useState(false);
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
        toast.error(error.response?.data?.error || "Invalid credentials. Please try again.");
      },
    },
  });

  const registerMutation = useRegisterUser({
    mutation: {
      onSuccess: (data) => {
        authenticateUser(data.token, data.user);
        toast.success("Account created. Welcome to Liaison West.");
        setLocation("/account");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || "Registration failed. Please try again.");
      },
    },
  });

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", phone: "" },
  });

  return (
    <div className="min-h-screen flex bg-[#080808]">
      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex w-[52%] relative flex-col overflow-hidden">
        {/* Background image */}
        <img
          src="https://images.unsplash.com/photo-1504215680853-026ed2a45def?q=80&w=2000"
          alt="Luxury car"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Multi-layer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Animated accent line */}
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-white/40 to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-14">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-9 h-9 border border-white/30 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm tracking-widest">LW</span>
            </div>
            <span className="text-white font-semibold tracking-[0.2em] text-xs uppercase">
              Liaison West
            </span>
          </div>

          {/* Hero text */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/80 text-xs tracking-widest uppercase font-medium">
                Members Portal
              </span>
            </div>

            <h1 className="text-5xl xl:text-6xl font-serif font-bold text-white leading-[1.05] mb-6">
              Drive what you
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/50">
                deserve.
              </span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed max-w-sm">
              Your personal automotive concierge. Curated vehicles, seamless financing, white-glove delivery.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-4 mb-12">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white/70" />
                </div>
                <span className="text-white/65 text-sm">{label}</span>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="border-t border-white/10 pt-8">
            <blockquote className="text-white/55 text-sm italic leading-relaxed mb-3">
              "Liaison West made buying my dream car effortless. Approved in minutes, delivered the same week."
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-400 to-zinc-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">JM</span>
              </div>
              <div>
                <p className="text-white/70 text-xs font-semibold">James M.</p>
                <p className="text-white/35 text-xs">Verified Buyer — 2024 Porsche Cayenne</p>
              </div>
              <div className="ml-auto flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 py-16 relative">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)] pointer-events-none" />

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-8 h-8 border border-white/30 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">LW</span>
          </div>
          <span className="text-white font-semibold tracking-widest text-xs uppercase">Liaison West</span>
        </div>

        <div className="w-full max-w-[420px] relative">
          {/* Mode toggle pill */}
          <div className="relative flex bg-white/5 border border-white/10 rounded-2xl p-1.5 mb-10">
            <div
              className="absolute top-1.5 bottom-1.5 bg-white rounded-xl transition-all duration-300 ease-out"
              style={{ left: mode === "login" ? "6px" : "50%", width: "calc(50% - 6px)" }}
            />
            <button
              onClick={() => setMode("login")}
              className={`relative flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors duration-200 z-10 ${
                mode === "login" ? "text-black" : "text-white/50 hover:text-white/80"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("register")}
              className={`relative flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors duration-200 z-10 ${
                mode === "register" ? "text-black" : "text-white/50 hover:text-white/80"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-serif font-bold text-white mb-1.5">
              {mode === "login" ? "Welcome back." : "Join Liaison West."}
            </h2>
            <p className="text-white/40 text-sm">
              {mode === "login"
                ? "Sign in to access your account and saved vehicles."
                : "Create your account to start your premium automotive journey."}
            </p>
          </div>

          {/* ── LOGIN FORM ── */}
          {mode === "login" && (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit((v) => loginMutation.mutate({ data: v }))} className="space-y-5">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/60 text-xs tracking-wider uppercase font-semibold">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="you@example.com"
                            className="h-13 bg-white/[0.04] border-white/10 text-white placeholder:text-white/25 focus:border-white/30 focus:bg-white/[0.07] rounded-xl px-4 text-sm transition-all"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between mb-1">
                        <FormLabel className="text-white/60 text-xs tracking-wider uppercase font-semibold">
                          Password
                        </FormLabel>
                        <button type="button" className="text-xs text-white/40 hover:text-white/70 transition-colors">
                          Forgot password?
                        </button>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPw ? "text" : "password"}
                            placeholder="••••••••••"
                            className="h-13 bg-white/[0.04] border-white/10 text-white placeholder:text-white/25 focus:border-white/30 focus:bg-white/[0.07] rounded-xl px-4 pr-12 text-sm transition-all"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw(!showPw)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                          >
                            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full h-13 bg-white text-black font-bold text-sm rounded-xl hover:bg-white/90 transition-all group mt-2"
                >
                  {loginMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign In
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
              </form>
            </Form>
          )}

          {/* ── REGISTER FORM ── */}
          {mode === "register" && (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit((v) => registerMutation.mutate({ data: v }))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="text-white/60 text-xs tracking-wider uppercase font-semibold">
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John Doe"
                            className="h-13 bg-white/[0.04] border-white/10 text-white placeholder:text-white/25 focus:border-white/30 rounded-xl px-4 text-sm transition-all"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/60 text-xs tracking-wider uppercase font-semibold">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="you@example.com"
                          className="h-13 bg-white/[0.04] border-white/10 text-white placeholder:text-white/25 focus:border-white/30 rounded-xl px-4 text-sm transition-all"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/60 text-xs tracking-wider uppercase font-semibold">
                        Phone <span className="text-white/25 normal-case font-normal">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+1 (555) 000-0000"
                          className="h-13 bg-white/[0.04] border-white/10 text-white placeholder:text-white/25 focus:border-white/30 rounded-xl px-4 text-sm transition-all"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/60 text-xs tracking-wider uppercase font-semibold">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPw ? "text" : "password"}
                            placeholder="At least 6 characters"
                            className="h-13 bg-white/[0.04] border-white/10 text-white placeholder:text-white/25 focus:border-white/30 rounded-xl px-4 pr-12 text-sm transition-all"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw(!showPw)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                          >
                            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="w-full h-13 bg-white text-black font-bold text-sm rounded-xl hover:bg-white/90 transition-all group mt-2"
                >
                  {registerMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Create Account
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>

                <p className="text-white/30 text-xs text-center leading-relaxed pt-1">
                  By creating an account, you agree to our Terms of Service and Privacy Policy.
                </p>
              </form>
            </Form>
          )}

          {/* Divider */}
          <div className="relative flex items-center my-8">
            <div className="flex-1 h-px bg-white/8" />
            <span className="mx-4 text-white/25 text-xs tracking-wider uppercase">or</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Agent portal link */}
          <a
            href="/agent/login"
            className="flex items-center justify-between w-full p-4 rounded-xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 transition-all group"
          >
            <div>
              <p className="text-white/70 text-sm font-medium">Dealer / Agent Portal</p>
              <p className="text-white/30 text-xs mt-0.5">Access your inventory management dashboard</p>
            </div>
            <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
          </a>

          {/* Security note */}
          <div className="flex items-center justify-center gap-2 mt-8">
            <Shield className="w-3.5 h-3.5 text-white/20" />
            <span className="text-white/25 text-xs">256-bit SSL encryption. Your data is always protected.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
