import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import { AuthProvider } from "./context/AuthContext";
import { CriteriaProvider } from "./context/CriteriaContext";
import { FirebaseProvider } from "./context/FirebaseContext";
import { RatingProvider } from "./context/RatingContext";
import { UserProvider } from "./context/UserContext";
import Criteria from "./pages/Criteria";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Ratings from "./pages/Ratings";
import Settings from "./pages/Settings";
import Users from "./pages/Users";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <FirebaseProvider>
        <AuthProvider>
          <UserProvider>
            <CriteriaProvider>
              <RatingProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<AppLayout />}>
                      <Route index element={<Dashboard />} />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="users" element={<Users />} />
                      <Route path="criteria" element={<Criteria />} />
                      <Route path="ratings" element={<Ratings />} />
                      <Route path="settings" element={<Settings />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </RatingProvider>
            </CriteriaProvider>
          </UserProvider>
        </AuthProvider>
      </FirebaseProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
