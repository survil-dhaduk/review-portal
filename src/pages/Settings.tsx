
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

const PasswordSchema = Yup.object().shape({
  currentPassword: Yup.string().required("Current password is required"),
  newPassword: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("New password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords must match")
    .required("Confirm password is required"),
});

const Settings: React.FC = () => {
  const { currentUser, resetPassword } = useAuth();
  const [passwordSuccess, setPasswordSuccess] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);
  const [theme, setTheme] = useState<string>("light");

  const handlePasswordChange = async (values: any, { resetForm }: any) => {
    try {
      setPasswordSuccess(false);
      setPasswordError(null);
      
      // In a real app, you would verify the current password
      // and update the password in Firebase Auth
      // This is just a mock implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setPasswordSuccess(true);
      resetForm();
    } catch (error: any) {
      setPasswordError(error.message || "Failed to change password");
    }
  };

  const handleResetPassword = async () => {
    try {
      if (currentUser?.email) {
        await resetPassword(currentUser.email);
        setPasswordSuccess(true);
      }
    } catch (error: any) {
      setPasswordError(error.message || "Failed to send reset email");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              View and update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={currentUser?.name} disabled />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" value={currentUser?.email} disabled />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input 
                id="role" 
                value={currentUser?.role.replace('_', ' ')} 
                className="capitalize"
                disabled 
              />
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Contact your administrator to update profile information
            </p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your account password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {passwordSuccess && (
              <Alert className="mb-4 bg-green-50 text-green-700 border-green-200">
                <AlertDescription>
                  Password updated successfully
                </AlertDescription>
              </Alert>
            )}
            
            {passwordError && (
              <Alert className="mb-4 bg-red-50 text-red-700 border-red-200">
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}
            
            <Formik
              initialValues={{
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
              }}
              validationSchema={PasswordSchema}
              onSubmit={handlePasswordChange}
            >
              {({ errors, touched }) => (
                <Form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Field
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      as={Input}
                    />
                    {errors.currentPassword && touched.currentPassword && (
                      <div className="text-sm text-red-500">
                        {String(errors.currentPassword)}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Field
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      as={Input}
                    />
                    {errors.newPassword && touched.newPassword && (
                      <div className="text-sm text-red-500">
                        {String(errors.newPassword)}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Field
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      as={Input}
                    />
                    {errors.confirmPassword && touched.confirmPassword && (
                      <div className="text-sm text-red-500">
                        {String(errors.confirmPassword)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleResetPassword}
                    >
                      Reset Password
                    </Button>
                    <Button type="submit">
                      Update Password
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Manage your notification and display preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Notifications</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications" className="font-normal">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive rating reminders and updates via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Appearance</h3>
              
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select defaultValue={theme} onValueChange={setTheme}>
                  <SelectTrigger id="theme" className="w-full">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Save Preferences
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Help & Support</CardTitle>
            <CardDescription>
              Get help with using the performance review system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="text-sm font-medium mb-2">Documentation</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Learn how to use the performance review portal effectively
              </p>
              <Button variant="outline" className="w-full">
                View Documentation
              </Button>
            </div>
            
            <div className="rounded-lg border p-4">
              <h3 className="text-sm font-medium mb-2">Contact Support</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Need help? Contact our support team
              </p>
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
