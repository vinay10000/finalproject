import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { Loader2, User, ArrowLeft, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user, isLoading, loginMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Initialize form with user data when available
  useState(() => {
    if (user) {
      setEmail(user.email || "");
    }
  });
  
  // Update email mutation
  const updateEmailMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", "/api/user/email", { email });
      return await res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Email Updated",
        description: "Your email has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", "/api/user/password", { password });
      return await res.json();
    },
    onSuccess: () => {
      setPassword("");
      setConfirmPassword("");
      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/user");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
      navigate("/auth");
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleUpdateEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    updateEmailMutation.mutate();
  };
  
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast({
        title: "Password Required",
        description: "Please enter a new password.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "The passwords you entered don't match.",
        variant: "destructive",
      });
      return;
    }
    if (password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }
    updatePasswordMutation.mutate();
  };
  
  const handleDeleteAccount = () => {
    if (deleteAccountConfirm !== user?.username) {
      toast({
        title: "Confirmation Failed",
        description: "Please type your username exactly to confirm account deletion.",
        variant: "destructive",
      });
      return;
    }
    deleteAccountMutation.mutate();
    setIsDeleteDialogOpen(false);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-medium mb-2">Not Logged In</h2>
          <p className="text-gray-500 mb-6">You need to be logged in to view your profile.</p>
          <Link href="/auth">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-6 flex items-center">
        <Link href="/" className="mr-4">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Account Settings</h1>
      </div>
      
      <Tabs defaultValue="profile" className="w-full max-w-3xl mx-auto">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account details and public profile information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateEmail} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    value={user.username}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">Usernames cannot be changed</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={updateEmailMutation.isPending || email === user.email}
                >
                  {updateEmailMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : "Update Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input 
                    id="new-password" 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input 
                    id="confirm-password" 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={updatePasswordMutation.isPending || !password || password !== confirmPassword}
                >
                  {updatePasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="danger">
          <Card className="border-red-100">
            <CardHeader className="border-b border-red-100">
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible account actions
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Caution</AlertTitle>
                <AlertDescription>
                  The actions in this section can result in permanent data loss and cannot be undone.
                </AlertDescription>
              </Alert>
              
              <div className="border border-red-200 rounded-md p-4">
                <h3 className="text-lg font-medium text-red-600 mb-2">Delete Account</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Permanently delete your account and all associated data. This action cannot be reversed.
                </p>
                
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">Delete Account</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-red-600">Confirm Account Deletion</DialogTitle>
                      <DialogDescription>
                        This action is permanent and cannot be undone. All your data, including your investments and startup information, will be permanently deleted.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4">
                      <p className="text-sm font-medium mb-2">
                        To confirm, please type your username: <span className="font-bold">{user.username}</span>
                      </p>
                      <Input
                        value={deleteAccountConfirm}
                        onChange={(e) => setDeleteAccountConfirm(e.target.value)}
                        placeholder={user.username}
                        className="border-red-200"
                      />
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteAccount}
                        disabled={deleteAccountMutation.isPending || deleteAccountConfirm !== user.username}
                      >
                        {deleteAccountMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : "Delete Permanently"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}