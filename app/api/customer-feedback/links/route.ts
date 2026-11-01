import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Manual feedback links are no longer available. Feedback emails are sent automatically after delivery.' },
    { status: 410 },
  );
}
