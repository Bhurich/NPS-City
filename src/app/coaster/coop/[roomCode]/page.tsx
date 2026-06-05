'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DisabledCoasterCoopPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-sky-50 text-slate-600">
      กำลังกลับไป NPS City...
    </main>
  );
}
