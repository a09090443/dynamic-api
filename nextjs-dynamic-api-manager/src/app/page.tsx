'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CircularProgress, Box } from '@mui/material';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 重定向到 endpoint 頁面
    router.push('/endpoint');
  }, [router]);

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
      <CircularProgress />
    </Box>
  );
}
