
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [hasConfig, setHasConfig] = useState(true);

  useEffect(() => {
    // Check if Firebase config is available
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    
    if (!apiKey || !authDomain || !projectId) {
      setHasConfig(false);
    }
  }, []);

  if (!hasConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl text-center text-red-600">Firebase Configuration Missing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Your Firebase configuration is incomplete. Please create a <code>.env</code> file in the project root 
              with the following variables:
            </p>
            <div className="bg-gray-100 p-3 rounded font-mono text-sm mb-4 overflow-x-auto">
              VITE_FIREBASE_API_KEY=your_api_key<br />
              VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain<br />
              VITE_FIREBASE_PROJECT_ID=your_project_id<br />
              VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket<br />
              VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id<br />
              VITE_FIREBASE_APP_ID=your_app_id
            </div>
            <p className="text-sm text-gray-600 mb-4">
              You can find these values in the Firebase console under Project Settings.
            </p>
            <Button 
              className="w-full" 
              onClick={() => window.open("https://firebase.google.com/docs/web/setup", "_blank")}
            >
              Firebase Setup Guide
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <Navigate to="/login" />;
};

export default Index;
