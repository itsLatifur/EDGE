// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/videos');
  // Keep a return statement to satisfy Next.js page requirements, though redirect will prevent rendering.
  return null; 
}
