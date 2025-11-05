'use client';

import { AuthForm } from '@/components/auth-form';

export default function SignUpPage() {
  return (
    <div className="container max-w-sm mx-auto py-12">
      <AuthForm mode="signup" />
    </div>
  );
}
