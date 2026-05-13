'use client';

import { useTransition } from 'react';
import { Button } from './ui/button';
import { fetchPOST } from '@/lib/fetch-client';

export default function EmailButton() {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await fetchPOST(`/api/send-mail`, { recipientEmail: 'j.kahtava@cityssm.on.ca' });
      // Handle response or toast notification here
      console.log('Email sent!', result);
    });
  };

  return (
    <Button onClick={handleClick} disabled={isPending}>
      {isPending ? 'Sending...' : 'Send Email'}
    </Button>
  );
}
