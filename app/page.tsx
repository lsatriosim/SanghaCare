// app/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/client'

export default async function HomePage() {
  redirect('/user');
}