
import React, { createContext, useContext, useState } from "react";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  deleteDoc 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { CriteriaSet, UserRole, Criterion } from "../types";

interface CriteriaContextType {
  addCriteriaSet: (role: UserRole, criteria: Criterion[]) => Promise<string>;
  updateCriteriaSet: (id: string, criteria: Criterion[]) => Promise<void>;
  deleteCriteriaSet: (id: string) => Promise<void>;
  getCriteriaByRole: (role: UserRole) => Promise<CriteriaSet | null>;
}

const CriteriaContext = createContext<CriteriaContextType | undefined>(undefined);

export const useCriteria = () => {
  const context = useContext(CriteriaContext);
  if (context === undefined) {
    throw new Error("useCriteria must be used within a CriteriaProvider");
  }
  return context;
};

export const CriteriaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [criteriaSet, setCriteriaSet] = useState<CriteriaSet | null>(null);

  // Add a new criteria set
  const addCriteriaSet = async (role: UserRole, criteria: Criterion[]): Promise<string> => {
    try {
      const criteriaSetRef = await addDoc(collection(db, "criteria"), {
        role,
        criteria,
        createdAt: serverTimestamp()
      });
      
      return criteriaSetRef.id;
    } catch (error) {
      console.error("Error adding criteria set:", error);
      throw error;
    }
  };

  // Update a criteria set
  const updateCriteriaSet = async (id: string, criteria: Criterion[]): Promise<void> => {
    try {
      await updateDoc(doc(db, "criteria", id), { 
        criteria,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating criteria set:", error);
      throw error;
    }
  };

  // Delete a criteria set
  const deleteCriteriaSet = async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, "criteria", id));
    } catch (error) {
      console.error("Error deleting criteria set:", error);
      throw error;
    }
  };

  // Get criteria by role
  const getCriteriaByRole = async (role: UserRole): Promise<CriteriaSet | null> => {
    try {
      const criteriaQuery = query(
        collection(db, "criteria"),
        where("role", "==", role)
      );
      
      const querySnapshot = await getDocs(criteriaQuery);
      
      if (!querySnapshot.empty) {
        const criteriaDoc = querySnapshot.docs[0];
        const fetchedCriteria = {
          id: criteriaDoc.id,
          ...criteriaDoc.data()
        } as CriteriaSet;
        
        setCriteriaSet(fetchedCriteria);
        return fetchedCriteria;
      }
      
      return null;
    } catch (error) {
      console.error("Error getting criteria:", error);
      throw error;
    }
  };

  const value = {
    addCriteriaSet,
    updateCriteriaSet,
    deleteCriteriaSet,
    getCriteriaByRole
  };

  return (
    <CriteriaContext.Provider value={value}>
      {children}
    </CriteriaContext.Provider>
  );
};
