'use client';

import { Loader2Icon, Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const [isMounted, setMounted] = useState(false);

  const handleChangeTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <Button>
        <Loader2Icon className="animate-spin" />
      </Button>
    );
  }

  return (
    <>
      {resolvedTheme ? (
        <Button onClick={() => handleChangeTheme()}>{resolvedTheme === 'dark' ? <Sun></Sun> : <Moon></Moon>}</Button>
      ) : (
        <Button>
          <Loader2Icon className="animate-spin" />
        </Button>
      )}
    </>
  );
}
