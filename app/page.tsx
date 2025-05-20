'use client;' // This is a client component, so we can use hooks like useState or useEffect

import Link from 'next/link';
import LandingPageNavbar from '@/components/LandingPageNavbar';


export default function LandingPage() {



 
  
  return (
    <main className="min-h-screen flex flex-col">
      <LandingPageNavbar />
      <section className="flex-1 flex flex-col justify-center items-center text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">synaps</h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-xl mb-8">
          Your smart hub for productivity, collaboration, and insights — all in one platform.
        </p>
        <Link href="/dashboard">
          <button className="px-6 py-3 text-lg">Get Started</button>
        </Link>
      </section>
    </main>
  );
}


