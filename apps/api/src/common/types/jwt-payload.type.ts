export interface JwtPayload {
  sub: string; // Supabase auth user ID
  email?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  app_metadata?: {
    role?: string; // 'PARENT' | 'CHILD'
    user_id?: string; // public.users.id (UUID)
    child_id?: string; // public.children.id (UUID) — only for child JWTs
  };
}

export interface RequestUser {
  sub: string;
  email?: string;
  role: string;
  userId?: string;
  childId?: string;
}
