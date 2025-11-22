import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/home');
}

// ======= ORIGINAL IMPLEMENTATION MOVED TO SEPARATE PAGES =======

// Landing page: /home/page.tsx
// Email check: /check/page.tsx
// Beta signup form: /form/page.tsx
// User dashboard: /dashboard/page.tsx

// ===== URL STRUCTURE =====
// localhost:3000/home - Landing page with navigation
// localhost:3000/check - Check beta access status
// localhost:3000/form l Beta signup form
//ocalhost:3000/form - Beta siRorm
// localhost:3000/dashboard - Referral dashboard
  //  (kept separate for security)
