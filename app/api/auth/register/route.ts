import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { signUpSchema } from '@/lib/validations/schemas';

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid registration request.' }, { status: 400 });
  }

  const parsedBody = signUpSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid registration details.' }, { status: 400 });
  }

  const { email, password, full_name, phone } = parsedBody.data;
  const role = 'supervisor';

  try {
    const supabase = getSupabaseAdmin();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, phone, role },
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Unable to create account.' }, { status: 400 });
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
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: 'Unable to create account.' }, { status: 500 });
    }

    return NextResponse.json({ userId });
  } catch {
    return NextResponse.json({ error: 'Unable to complete registration.' }, { status: 500 });
  }
}
