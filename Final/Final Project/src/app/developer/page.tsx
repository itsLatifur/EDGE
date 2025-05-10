// src/app/developer/page.tsx
import { LoginForm } from '@/components/auth/LoginForm';

export default function DeveloperLoginPage() {
  return (
    <div className="min-h-[calc(100vh-var(--header-height,64px)-var(--footer-height,57px))] flex items-center justify-center p-4 bg-muted/30">
      <LoginForm />
    </div>
  );
}
