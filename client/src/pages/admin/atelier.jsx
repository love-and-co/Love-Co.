import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AtelierPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  return null;
}
