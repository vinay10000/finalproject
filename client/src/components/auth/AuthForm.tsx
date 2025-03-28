import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useMetaMask } from "@/hooks/use-metamask";
import { Check, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AuthFormProps = {
  defaultTab?: "login" | "register";
};

// Extending the schema for login
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Extending the schema for registration
const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export function AuthForm({ defaultTab = "login" }: AuthFormProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);
  const { loginMutation, registerMutation } = useAuth();
  const { connect, address, isConnecting } = useMetaMask();
  const { toast } = useToast();

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      userType: "investor",
      walletAddress: address || "",
    },
  });

  // Update the wallet address in the form when it changes
  useEffect(() => {
    if (address) {
      registerForm.setValue("walletAddress", address);
    }
  }, [address, registerForm]);

  async function onLoginSubmit(data: LoginFormData) {
    loginMutation.mutate(data);
  }

  async function onRegisterSubmit(data: RegisterFormData) {
    // Make sure the walletAddress is set if available
    if (address && !data.walletAddress) {
      data.walletAddress = address;
    }

    // Remove confirmPassword as it's not in our schema
    const { confirmPassword, ...userData } = data;
    registerMutation.mutate(userData);
  }

  async function connectWallet() {
    try {
      await connect();
      toast({
        title: "Wallet connected",
        description: "Your MetaMask wallet has been connected successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error?.message || "Failed to connect to MetaMask wallet",
        variant: "destructive",
      });
    }
  }

  return (
    <Card className="w-full max-w-md">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Sign In</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>

        <CardContent className="pt-6">
          <TabsContent value="login">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Username" {...field} />
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
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign in"}
                </Button>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-2 text-sm text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={connectWallet} 
                  disabled={isConnecting}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  {isConnecting ? "Connecting..." : "Connect with MetaMask"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="register">
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Account type</div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={registerForm.control}
                      name="userType"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex">
                              <Button
                                type="button"
                                variant={field.value === "investor" ? "default" : "outline"}
                                className="w-full rounded-r-none"
                                onClick={() => field.onChange("investor")}
                              >
                                Investor
                              </Button>
                              <Button
                                type="button"
                                variant={field.value === "startup" ? "default" : "outline"}
                                className="w-full rounded-l-none"
                                onClick={() => field.onChange("startup")}
                              >
                                Startup
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Username" {...field} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@example.com" {...field} />
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
                        <Input type="password" placeholder="********" {...field} />
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
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={connectWallet}
                  disabled={isConnecting || !!address}
                >
                  {address ? (
                    <>
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      Wallet Connected: {address.slice(0, 6)}...{address.slice(-4)}
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      {isConnecting ? "Connecting..." : "Connect MetaMask Wallet"}
                    </>
                  )}
                </Button>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Creating account..." : "Create account"}
                </Button>

                <p className="text-xs text-muted-foreground mt-4">
                  By creating an account, you agree to our Terms of Service and Privacy Policy.
                </p>
              </form>
            </Form>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
