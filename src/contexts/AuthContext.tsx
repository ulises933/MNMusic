import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'musician' | 'organizer' | 'user';

interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  display_name: string;
  avatar_url: string | null;
  city: string | null;
  phone: string | null;
  bio: string | null;
}

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  trial_ends_at: string | null;
  plan?: {
    name: string;
    slug: string;
  };
}

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole;
  isAdmin: boolean;
  subscription: Subscription | null;
  userName: string;
  userAvatar: string;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (data) setProfile(data as Profile);
    return data as Profile | null;
  };

  const fetchAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    setIsAdmin(data?.role === 'admin');
  };

  const fetchSubscription = async (userId: string) => {
    const { data } = await supabase
      .from('user_subscriptions')
      .select('id, plan_id, status, trial_ends_at')
      .eq('user_id', userId)
      .maybeSingle();
    if (data) {
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('name, slug')
        .eq('id', data.plan_id)
        .maybeSingle();
      setSubscription({ ...data, plan: plan || undefined });
    }
  };

  const loadUserData = async (userId: string) => {
    await Promise.all([
      fetchProfile(userId),
      fetchAdminRole(userId),
      fetchSubscription(userId),
    ]);
  };

  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(() => loadUserData(sess.user.id), 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setSubscription(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        loadUserData(sess.user.id);
      }
      setLoading(false);
    });

    return () => authSub.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signup = async (email: string, password: string, name: string, role: UserRole) => {
    // Signup sin verificación de email
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name, role },
        // Desactivar verificación de email - el usuario se autentica inmediatamente
        emailRedirectTo: undefined,
      },
    });
    
    if (!error && data.user) {
      // Esperar un momento para que se complete el trigger
      await new Promise(r => setTimeout(r, 1000));
      
      // Si no hay sesión (porque requiere verificación), intentar hacer login automáticamente
      if (!data.session) {
        // Intentar login automático después del signup
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) {
          // Si el login falla, el usuario necesita verificar email
          // Pero continuamos de todas formas
        }
      }
      
      // Obtener el usuario actualizado
      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (newUser) {
        if (role === 'musician') {
          await supabase.from('artist_profiles').insert({ user_id: newUser.id, artist_name: name });
        } else if (role === 'organizer') {
          await supabase.from('organizer_profiles').insert({ user_id: newUser.id, company_name: name });
        }
      }
    }
    return { error: error?.message ?? null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsAdmin(false);
    setSubscription(null);
  };

  const refreshProfile = async () => {
    if (user) await loadUserData(user.id);
  };

  const role: UserRole = (profile?.role as UserRole) || 'user';
  const userName = profile?.display_name || user?.email || '';
  const userAvatar = profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id?.slice(0, 8) || 'default'}`;

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!session,
      loading,
      user,
      session,
      profile,
      role,
      isAdmin,
      subscription,
      userName,
      userAvatar,
      login,
      signup,
      logout,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
