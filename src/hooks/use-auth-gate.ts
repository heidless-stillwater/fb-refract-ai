'use client';

import { useUser, useAuth, initiateAnonymousSignIn } from '@/firebase';

export function useAuthGate() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const ensureAuthenticated = async (): Promise<boolean> => {
    if (isUserLoading) {
      // Wait for the auth state to be determined
      await new Promise(resolve => {
        const interval = setInterval(() => {
          if (!isUserLoading) {
            clearInterval(interval);
            resolve(null);
          }
        }, 100);
      });
    }

    if (user) {
      return true; // Already authenticated
    }

    try {
      // Not authenticated, attempt anonymous sign-in
      initiateAnonymousSignIn(auth);
      // We don't await here. The onAuthStateChanged listener will update the user state.
      // We can poll for the user object to become available.
      await new Promise((resolve, reject) => {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (auth.currentUser) {
            clearInterval(interval);
            resolve(null);
          }
          if (attempts > 50) { // 5 seconds timeout
            clearInterval(interval);
            reject(new Error("Authentication timed out."));
          }
        }, 100);
      });
      return !!auth.currentUser;
    } catch (error) {
      console.error('Anonymous sign-in failed:', error);
      return false;
    }
  };

  return { ensureAuthenticated };
}
