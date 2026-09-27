import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { ref, get, set } from "firebase/database";
import { auth, database } from "../firebase";
import { setAuthTokenGetter, api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("citizen"); // 'citizen' | 'controller'
  const [loading, setLoading] = useState(true);

  // Configure api client with token getter
  useEffect(() => {
    setAuthTokenGetter(async () => {
      if (!user) return null;
      if (user.isDemo) {
        return `demo-${user.role}-token`;
      }
      if (auth.currentUser) {
        return await auth.currentUser.getIdToken();
      }
      return null;
    });
  }, [user]);

  useEffect(() => {
    // Check localStorage for demo session first
    const savedDemoUser = localStorage.getItem("traffictwin_demo_user");
    if (savedDemoUser) {
      try {
        const parsed = JSON.parse(savedDemoUser);
        setUser(parsed);
        setRole(parsed.role || "citizen");
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem("traffictwin_demo_user");
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch role from RTDB /Users/{uid}
        let userRole = "citizen";
        try {
          const userSnapshot = await get(ref(database, `Users/${firebaseUser.uid}`));
          if (userSnapshot.exists()) {
            userRole = userSnapshot.val().role || "citizen";
          } else {
            // Default role deduction
            userRole = firebaseUser.email?.startsWith("controller@") ? "controller" : "citizen";
          }
        } catch (err) {
          console.warn("Could not load user role from DB:", err);
          userRole = firebaseUser.email?.startsWith("controller@") ? "controller" : "citizen";
        }

        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
          role: userRole,
          isDemo: false
        };
        setUser(userData);
        setRole(userRole);
      } else {
        setUser(null);
        setRole("citizen");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      localStorage.removeItem("traffictwin_demo_user");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (err) {
      // If Firebase emulator is offline or user enters demo creds without emulator, fall back to backend demo login
      if (email === "citizen@demo.com" || email === "controller@demo.com") {
        return demoLogin(email.includes("controller") ? "controller" : "citizen");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, name, selectedRole) => {
    setLoading(true);
    try {
      localStorage.removeItem("traffictwin_demo_user");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      
      // Save in Realtime Database /Users
      await set(ref(database, `Users/${newUser.uid}`), {
        uid: newUser.uid,
        email: newUser.email,
        name: name || email.split("@")[0],
        role: selectedRole,
        createdAt: Date.now()
      });

      setUser({
        uid: newUser.uid,
        email: newUser.email,
        name: name || email.split("@")[0],
        role: selectedRole,
        isDemo: false
      });
      setRole(selectedRole);
      return newUser;
    } catch (err) {
      // Register via backend endpoint as fallback
      try {
        const res = await api.register({ email, password, name, role: selectedRole });
        const dummyUser = {
          uid: res.user.uid,
          email: res.user.email,
          name: res.user.name,
          role: res.user.role,
          isDemo: true
        };
        localStorage.setItem("traffictwin_demo_user", JSON.stringify(dummyUser));
        setUser(dummyUser);
        setRole(dummyUser.role);
        return dummyUser;
      } catch (beErr) {
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = (selectedRole) => {
    const isCtrl = selectedRole === "controller";
    const demoUserData = {
      uid: isCtrl ? "demo-controller-id" : "demo-citizen-id",
      email: isCtrl ? "controller@demo.com" : "citizen@demo.com",
      name: isCtrl ? "Demo Controller" : "Demo Citizen",
      role: selectedRole,
      isDemo: true
    };
    localStorage.setItem("traffictwin_demo_user", JSON.stringify(demoUserData));
    setUser(demoUserData);
    setRole(selectedRole);
    return demoUserData;
  };

  const logout = async () => {
    localStorage.removeItem("traffictwin_demo_user");
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Sign out note:", e);
    }
    setUser(null);
    setRole("citizen");
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, signup, demoLogin, logout, isController: role === "controller" }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
