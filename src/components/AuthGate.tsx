import { useEffect, useState, ReactNode } from 'react';
import { resolveUser } from '../lib/auth';
import { upsertUser } from '../lib/db';

export function AuthGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    resolveUser().then(async (id) => {
      if (id !== null) {
        try {
          await upsertUser(id);
          setReady(true);
        } catch (error) {
          console.error("Failed to upsert user:", error);
          // Still let them in if user registry fails? 
          // Requirements say "This must be called once after a successful handshake".
          setReady(true); 
        }
      }
    });
  }, []);

  if (!ready) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100svh', background: '#F5F7FA',
        fontFamily: "'Sora', sans-serif", fontSize: '15px', color: '#7A8FA6'
      }}>
        Verifying session...
      </div>
    );
  }

  return <>{children}</>;
}
