'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const [message, setMessage] = useState('กำลังเข้าสู่ระบบ...');

  useEffect(() => {
    async function finishLogin() {
      if (!supabase) {
        setMessage('ยังไม่ได้เชื่อม Supabase');
        window.setTimeout(() => window.location.replace('/'), 1200);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('[Auth] Failed to exchange code:', error);
          setMessage('เข้าสู่ระบบไม่สำเร็จ กำลังกลับหน้าเกม...');
          window.setTimeout(() => window.location.replace('/'), 1600);
          return;
        }
      }

      window.location.replace('/');
    }

    finishLogin();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-light mb-3">NPS City</div>
        <div className="text-white/60">{message}</div>
      </div>
    </main>
  );
}
