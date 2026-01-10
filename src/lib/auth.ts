import { supabase } from './supabase';
import { User } from '../types';

// Simple hash function for passwords (for demo - in production use bcrypt)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Decode Google JWT token (client-side)
function decodeJWT(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

async function getSubscriptionStatus(userId: string) {
  const { data } = await supabase
    .from('user_settings')
    .select('is_subscribed, subscription_expires_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data) return { isPremium: false };

  const isPremium = data.is_subscribed &&
    (!data.subscription_expires_at || new Date(data.subscription_expires_at) > new Date());

  return {
    isPremium,
    subscriptionExpiresAt: data.subscription_expires_at
  };
}

export const authService = {
  // Refresh user data (get latest subscription status)
  async refreshUserData(userId: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      throw new Error('Failed to fetch user data');
    }

    const subscription = await getSubscriptionStatus(data.id);

    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      avatar: data.avatar_url,
      ...subscription
    };
  },

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<User> {
    const passwordHash = await hashPassword(password);

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password_hash', passwordHash)
      .maybeSingle();

    if (error || !data) {
      throw new Error('Invalid email or password');
    }

    // Update last sign in
    await supabase
      .from('users')
      .update({ last_sign_in_at: new Date().toISOString() })
      .eq('id', data.id);

    const subscription = await getSubscriptionStatus(data.id);

    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      avatar: data.avatar_url,
      ...subscription
    };
  },

  // Sign up with email and password
  async signUp(email: string, password: string, fullName?: string): Promise<User> {
    const passwordHash = await hashPassword(password);

    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      throw new Error('User already exists');
    }

    // Create new user
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        full_name: fullName,
        google_id: null
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error('Failed to create account');
    }

    const subscription = await getSubscriptionStatus(data.id);

    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      avatar: data.avatar_url,
      ...subscription
    };
  },

  // Sign in with Google JWT token
  async signInWithGoogle(credential: string): Promise<User> {
    const payload = decodeJWT(credential);

    if (!payload || !payload.email) {
      throw new Error('Invalid Google token');
    }

    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('google_id', payload.sub)
      .maybeSingle();

    if (existing) {
      // Update existing user
      const { data, error } = await supabase
        .from('users')
        .update({
          full_name: payload.name,
          avatar_url: payload.picture,
          last_sign_in_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select('id, email, full_name, avatar_url, google_id, created_at, updated_at, last_sign_in_at')
        .single();

      if (error || !data) {
        throw new Error('Failed to update user');
      }

      const subscription = await getSubscriptionStatus(data.id);

      return {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        avatar: data.avatar_url,
        ...subscription
      };
    } else {
      // Create new user
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: payload.email,
          full_name: payload.name,
          avatar_url: payload.picture,
          google_id: payload.sub,
          password_hash: null
        })
        .select('id, email, full_name, avatar_url, google_id, created_at, updated_at, last_sign_in_at')
        .single();

      if (error || !data) {
        throw new Error('Failed to create user');
      }

      const subscription = await getSubscriptionStatus(data.id);

      return {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        avatar: data.avatar_url,
        ...subscription
      };
    }
  }
};
