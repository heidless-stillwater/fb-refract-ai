import Image from 'next/image';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CornerDownRight, Download } from 'lucide-react';
import Link from 'next/link';

export type TransformationHistoryItem = {
  id: string;
  originalUrl: string;
  transformedUrl: string;
  transformationType: string;
  prompt?: string | null;
  originalHint: string;
  transformedHint: string;
};

type HistoryGalleryProps = {
  history: TransformationHistoryItem[];
};

export function HistoryGallery({ history }: HistoryGalleryProps) {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="mt-16">
      <h2 className="text-3xl font-headline font-bold mb-6 text-center md:text-left">
        Your Recent Transformations
      </h2>
      <div className="grid gap-8 md:grid-cols-1">
        {history.map(item => (
          <Card key={item.id} className="overflow-hidden shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="font-headline capitalize">
                  {item.transformationType.replace(/_/g, ' ')}
                </CardTitle>
                {item.prompt && (
                  <Badge variant="secondary" className="text-xs">
                    Custom Prompt Used
                  </Badge>
                )}
              </div>
              {item.prompt && (
                <CardDescription className="italic text-muted-foreground pt-1 flex gap-2 items-center">
                  <CornerDownRight size={16} /> "{item.prompt}"
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
              <div className="space-y-2">
                <p className="text-sm font-medium text-center text-muted-foreground">
                  Original
                </p>
                <div className="rounded-lg overflow-hidden border-2 border-transparent relative group">
                  <Image
                    src={item.originalUrl}
                    alt="Original image for transformation"
                    width={600}
                    height={400}
                    className="object-cover w-full h-auto aspect-video rounded-md"
                    data-ai-hint={item.originalHint}
                  />
                   <Link
                      href={item.originalUrl}
                      download={`original-${item.id}`}
                      className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-md"
                    >
                      <Download className="w-8 h-8" />
                    </Link>
                </div>
              </div>
              <div className="hidden md:block text-center">
                 <ArrowRight className="w-8 h-8 text-primary mx-auto" />
              </div>
              <div className="space-y-2 md:hidden text-center">
                  <svg className="w-8 h-8 text-primary mx-auto rotate-90" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-center text-muted-foreground">
                  Transformed
                </p>
                <div className="rounded-lg overflow-hidden border-2 border-primary/50 relative group">
                  <Image
                    src={item.transformedUrl}
                    alt="Transformed image"
                    width={600}
                    height={400}
                    className="object-cover w-full h-auto aspect-video rounded-md"
                    data-ai-hint={item.transformedHint}
                  />
                   <Link
                      href={item.transformedUrl}
                      download={`transformed-${item.id}`}
                      className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-md"
                    >
                      <Download className="w-8 h-8" />
                    </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
