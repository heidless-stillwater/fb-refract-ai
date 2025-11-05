'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="container max-w-screen-lg mx-auto py-8 px-4 text-center">
      <h1 className="text-4xl font-headline font-bold mb-4">
        Welcome to Refract AI
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        The future of image transformation. Upload an image and see the magic.
      </p>
      <Button asChild size="lg">
        <Link href="/upload-and-display">
          Start Transforming <ArrowRight className="ml-2" />
        </Link>
      </Button>
    </div>
  );
}
