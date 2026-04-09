// Auth is now handled by Clerk.
// This file is kept for the AdminUser type used across admin components.

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'מנהל' | 'רב' | 'צוות';
}
