
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
  deleteDoc, 
  Timestamp, 
  orderBy
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Rating, UserRole } from "../types";

interface RatingContextType {
  addRating: (ratingData: Omit<Rating, 'id' | 'createdAt'>) => Promise<string>;
  updateRating: (id: string, ratingData: Partial<Rating>) => Promise<void>;
  deleteRating: (id: string) => Promise<void>;
  getRatingsByUser: (userId: string, asRater?: boolean) => Promise<Rating[]>;
  getRatingsByMonth: (month: string) => Promise<Rating[]>;
  getAverageRatings: (userId: string, months: number) => Promise<Record<string, number>>;
}

const RatingContext = createContext<RatingContextType | undefined>(undefined);

export const useRatings = () => {
  const context = useContext(RatingContext);
  if (context === undefined) {
    throw new Error("useRatings must be used within a RatingProvider");
  }
  return context;
};

export const RatingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Add a new rating
  const addRating = async (ratingData: Omit<Rating, 'id' | 'createdAt'>): Promise<string> => {
    try {
      const ratingRef = await addDoc(collection(db, "ratings"), {
        ...ratingData,
        createdAt: serverTimestamp()
      });
      
      return ratingRef.id;
    } catch (error) {
      console.error("Error adding rating:", error);
      throw error;
    }
  };

  // Update a rating
  const updateRating = async (id: string, ratingData: Partial<Rating>): Promise<void> => {
    try {
      await updateDoc(doc(db, "ratings", id), { 
        ...ratingData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating rating:", error);
      throw error;
    }
  };

  // Delete a rating
  const deleteRating = async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, "ratings", id));
    } catch (error) {
      console.error("Error deleting rating:", error);
      throw error;
    }
  };

  // Get ratings by user (either given by or given to)
  const getRatingsByUser = async (userId: string, asRater = false): Promise<Rating[]> => {
    try {
      const fieldToQuery = asRater ? "givenBy" : "givenTo";
      
      const ratingsQuery = query(
        collection(db, "ratings"),
        where(fieldToQuery, "==", userId)
      );
      
      const querySnapshot = await getDocs(ratingsQuery);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Rating[];
    } catch (error) {
      console.error("Error getting ratings:", error);
      throw error;
    }
  };

  // Get ratings by month
  const getRatingsByMonth = async (month: string): Promise<Rating[]> => {
    try {
      const ratingsQuery = query(
        collection(db, "ratings"),
        ...(month ? [where("month", "==", month)] : []),
      );
      const querySnapshot = await getDocs(ratingsQuery);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Rating[];
    } catch (error) {
      console.error("Error getting ratings:", error);
      throw error;
    }
  };

  // Get average ratings for a user over the past N months
  const getAverageRatings = async (userId: string, months: number): Promise<Record<string, number>> => {
    try {
      const result: Record<string, number> = {};
      const currentDate = new Date();
      
      for (let i = 0; i < months; i++) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() - i;
        
        // Handle negative months by adjusting the year
        const adjustedDate = new Date(year, month, 1);
        const monthKey = `${adjustedDate.getFullYear()}-${String(adjustedDate.getMonth() + 1).padStart(2, '0')}`;
        
        const ratingsQuery = query(
          collection(db, "ratings"),
          where("givenTo", "==", userId),
          where("month", "==", monthKey)
        );
        
        const querySnapshot = await getDocs(ratingsQuery);
        const ratings = querySnapshot.docs.map(doc => doc.data() as Rating);
        
        if (ratings.length > 0) {
          // Calculate average based on rating types
          const pmRatings = ratings.filter(r => 
            r.givenBy.includes("project_manager")
          );
          
          const tlRatings = ratings.filter(r => 
            r.givenBy.includes("team_lead")
          );
          
          let pmAverage = 0;
          let tlAverage = 0;
          
          if (pmRatings.length > 0) {
            pmAverage = pmRatings.reduce((sum, r) => sum + r.averageScore, 0) / pmRatings.length;
          }
          
          if (tlRatings.length > 0) {
            tlAverage = tlRatings.reduce((sum, r) => sum + r.averageScore, 0) / tlRatings.length;
          }
          
          // Final rating calculation: 50% PM, 50% TL
          if (pmRatings.length > 0 && tlRatings.length > 0) {
            result[monthKey] = (pmAverage * 0.5) + (tlAverage * 0.5);
          } else if (pmRatings.length > 0) {
            result[monthKey] = pmAverage;
          } else if (tlRatings.length > 0) {
            result[monthKey] = tlAverage;
          } else {
            result[monthKey] = 0;
          }
        } else {
          result[monthKey] = 0;
        }
      }
      
      return result;
    } catch (error) {
      console.error("Error getting average ratings:", error);
      throw error;
    }
  };

  const value = {
    addRating,
    updateRating,
    deleteRating,
    getRatingsByUser,
    getRatingsByMonth,
    getAverageRatings
  };

  return (
    <RatingContext.Provider value={value}>
      {children}
    </RatingContext.Provider>
  );
};


