
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import React, { createContext, useContext, useState } from "react";
import * as XLSX from 'xlsx';
import { auth, db } from "../lib/firebase";
import { User, UserRole, UserUpload } from "../types";

interface UserContextType {
  addUser: (userData: Omit<User, 'uid' | 'createdAt'>) => Promise<string>;
  updateUser: (uid: string, userData: Partial<User>) => Promise<void>;
  deleteUser: (uid: string) => Promise<void>;
  getUsers: (role?: UserRole) => Promise<User[]>;
  uploadUsers: (file: File) => Promise<{ success: number; errors: string[] }>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUsers = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUsers must be used within a UserProvider");
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);

  // Add a new user
  const addUser = async (userData: Omit<User, 'uid' | 'createdAt'>): Promise<string> => {
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        "Kombee@123!" // Default temporary password
      );

      // Add user to Firestore
      const userDocRef = await addDoc(collection(db, "users"), {
        uid: userCredential.user.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        managers: userData.managers || [],
        teamLeads: userData.teamLeads || [],
        createdAt: serverTimestamp()
      });

      return userDocRef.id;
    } catch (error) {
      console.error("Error adding user:", error);
      throw error;
    }
  };

  // Update a user
  const updateUser = async (uid: string, userData: Partial<User>): Promise<void> => {
    try {
      const userQuery = query(collection(db, "users"), where("uid", "==", uid));
      const querySnapshot = await getDocs(userQuery);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "users", userDoc.id), userData);
      } else {
        throw new Error("User not found");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  };

  // Delete a user
  const deleteUser = async (uid: string): Promise<void> => {
    try {
      const userQuery = query(collection(db, "users"), where("uid", "==", uid));
      const querySnapshot = await getDocs(userQuery);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await deleteDoc(doc(db, "users", userDoc.id));
      } else {
        throw new Error("User not found");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  };

  // Get users with optional role filter
  const getUsers = async (role?: UserRole): Promise<User[]> => {
    try {
      let userQuery;

      if (role) {
        userQuery = query(collection(db, "users"), where("role", "==", role));
      } else {
        userQuery = query(collection(db, "users"));
      }

      const querySnapshot = await getDocs(userQuery);
      const fetchedUsers = querySnapshot.docs.map(doc => {
        const data = doc.data() as Record<string, any>;
        return {
          uid: data.uid,
          name: data.name,
          email: data.email,
          role: data.role,
          managers: data.managers || [],
          teamLeads: data.teamLeads || [],
          createdAt: data.createdAt,
          id: doc.id
        } as User;
      });

      setUsers(fetchedUsers);
      return fetchedUsers;
    } catch (error) {
      console.error("Error getting users:", error);
      throw error;
    }
  };

  // Upload users from Excel file
  const uploadUsers = async (file: File): Promise<{ success: number; errors: string[] }> => {
    try {
      const errors: string[] = [];
      let successCount = 0;

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<UserUpload>(worksheet);

      for (const row of jsonData) {
        try {
          const userData: Omit<User, 'uid' | 'createdAt'> = {
            name: row.name,
            email: row.email,
            role: row.role,
            managers: row.managers?.split(',') || [],
            teamLeads: row.teamLeads?.split(',') || []
          };

          await addUser(userData);
          successCount++;
        } catch (error: any) {
          errors.push(`Error adding ${row.email}: ${error.message}`);
        }
      }

      return { success: successCount, errors };
    } catch (error: any) {
      console.error("Error uploading users:", error);
      throw error;
    }
  };

  const value = {
    addUser,
    updateUser,
    deleteUser,
    getUsers,
    uploadUsers
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
