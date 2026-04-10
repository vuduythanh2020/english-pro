export interface JwtPayload {
  sub: string; // Supabase auth user ID
  email?: string;
  exp?: number;
  iat?: number;
  iss?: string;

  // Custom claims injected by custom_access_token_hook (root level)
  user_role?: string; // 'PARENT' | 'CHILD'
  user_id?: string; // public.parents.id (UUID)
  children_ids?: string[]; // public.child_profiles.id[]

  // Legacy: app_metadata path (kept for backward compatibility)
  app_metadata?: {
    role?: string;
    user_id?: string;
    child_id?: string;
  };
}

export interface RequestUser {
  sub: string;
  email?: string;
  role: string;
  userId?: string;
  childId?: string;
}
