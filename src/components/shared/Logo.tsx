// src/components/shared/Logo.tsx
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
      Self-Learn
    </Link>
  );
}
