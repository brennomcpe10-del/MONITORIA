import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Question, QuizResult, UserProfile, Role } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export const dbService = {
  // User Profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { uid: userId, ...docSnap.data() } as UserProfile;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${userId}`);
      return null;
    }
  },

  async createUserProfile(profile: UserProfile): Promise<void> {
    try {
      const docRef = doc(db, 'users', profile.uid);
      await setDoc(docRef, {
        name: profile.name,
        email: profile.email,
        role: profile.role,
        lastMissedQuestionIds: []
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${profile.uid}`);
    }
  },

  async updateUserLastMissed(userId: string, missedIds: string[]): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
        lastMissedQuestionIds: missedIds
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  },

  // Questions
  async getQuestionsByTopic(topic?: string): Promise<Question[]> {
    try {
      const qCol = collection(db, 'questions');
      const q = topic 
        ? query(qCol, where('topic', '==', topic))
        : query(qCol);
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'questions');
      return [];
    }
  },

  async addQuestion(question: Omit<Question, 'id' | 'createdAt'>): Promise<void> {
    try {
      const qCol = collection(db, 'questions');
      await addDoc(qCol, {
        ...question,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'questions');
    }
  },

  // Results
  async saveQuizResult(result: Omit<QuizResult, 'id' | 'date'>): Promise<void> {
    try {
      const rCol = collection(db, 'quiz_results');
      await addDoc(rCol, {
        ...result,
        date: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'quiz_results');
    }
  },

  async getStudentResults(userId: string): Promise<QuizResult[]> {
    try {
      const rCol = collection(db, 'quiz_results');
      const q = query(rCol, where('userId', '==', userId), orderBy('date', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizResult));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'quiz_results');
      return [];
    }
  },

  async getAllResults(): Promise<QuizResult[]> {
    try {
      const rCol = collection(db, 'quiz_results');
      const q = query(rCol, orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizResult));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'quiz_results');
      return [];
    }
  },

  async getAllQuestions(): Promise<Question[]> {
    try {
      const qCol = collection(db, 'questions');
      const snapshot = await getDocs(qCol);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'questions');
      return [];
    }
  }
};
