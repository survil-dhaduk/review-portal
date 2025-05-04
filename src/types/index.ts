import { Timestamp } from 'firebase/firestore';

// TypeScript definitions for the app

export enum UserRole {
  ADMIN = "admin",
  PROJECT_MANAGER = "project_manager",
  TEAM_LEAD = "team_lead",
  DEVELOPER = "developer"
}

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  managers?: string[]; // PM UIDs
  teamLeads?: string[]; // TL UIDs
  createdAt: Timestamp;
  averageScore?: number; // Added for dashboard display
}

export interface Criterion {
  title: string;
  weight: number;
}

export interface CriteriaSet {
  id?: string;
  role: UserRole;
  criteria: Criterion[];
  createdAt: Timestamp;
}

export interface Rating {
  id?: string;
  givenBy: string;
  givenTo: string;
  month: string; // Format: YYYY-MM
  criteria: {
    [key: string]: number;
  };
  averageScore: number;
  remarks: string;
  roleOfGivenTo: UserRole;
  createdAt: Timestamp;
}

export interface RatingCriteria {
  title: string;
  weight: number;
  score?: number;
}

export interface UserUpload {
  name: string;
  email: string;
  role: UserRole;
  managers?: string;
  teamLeads?: string;
}

// Context types
export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}
