import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role?: string;
}

export async function POST(request: Request) {
  const body: RegisterRequest = await request.json();
  const { email, password, full_name, phone, role = 'supervisor' } = body;

  if (!email || !password || !full_name) {
    return NextResponse.json({ error: 'Missing required registration fields.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, phone, role },
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message || 'Unable to create authentication user.' },
      { status: 500 }
    );
  }

  const userId = authData.user.id;

  const { error: userError } = await supabase.from('users').insert({
    id: userId,
    email,
    full_name,
    phone,
    role,
    status: 'active',
  });

  if (userError) {
    return NextResponse.json({ error: userError.message || 'Unable to create user profile.' }, { status: 500 });
  }

  return NextResponse.json({ userId });
}
