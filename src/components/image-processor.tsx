'use client';

import { useState, useRef, useTransition, useEffect } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { TransformationHistoryItem } from './history-gallery';
import { HistoryGallery } from './history-gallery';
import { useImageTransformations } from '@/hooks/use-image-transformations';
import { useAuthGate } from '@/hooks/use-auth-gate';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Upload, Wand2, RefreshCw, Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Textarea } from './ui/textarea';

const TRANSFORMATION_TYPES = [
  { id: 'style_transfer', label: 'Style Transfer', requiresPrompt: true },
  { id: 'background_removal', label: 'Background Removal' },
  { id: 'artistic_rendering', label: 'Artistic Rendering', requiresPrompt: true },
  { id: 'color_enhancement', label: 'Color Enhancement' },
];

const fileToDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const initialHistory: TransformationHistoryItem[] = [
  {
    id: 'hist-1',
    originalUrl: PlaceHolderImages[0].imageUrl,
    transformedUrl: PlaceHolderImages[1].imageUrl,
    transformationType: 'Artistic Rendering',
    prompt: 'Van Gogh style',
    originalHint: PlaceHolderImages[0].imageHint,
    transformedHint: PlaceHolderImages[1].imageHint,
  },
  {
    id: 'hist-2',
    originalUrl: PlaceHolderImages[2].imageUrl,
    transformedUrl: PlaceHolderImages[3].imageUrl,
    transformationType: 'Style Transfer',
    prompt: 'Cyberpunk aesthetic',
    originalHint: PlaceHolderImages[2].imageHint,
    transformedHint: PlaceHolderImages[3].imageHint,
  },
];

export default function ImageProcessor() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [transformedUrl, setTransformedUrl] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isGettingRecs, setIsGettingRecs] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [selectedTransform, setSelectedTransform] = useState<string>(
    TRANSFORMATION_TYPES[0].id
  );
  const [userPrompt, setUserPrompt] = useState('');
  
  const { ensureAuthenticated } = useAuthGate();

  const {
    history,
    isProcessing,
    progress,
    getRecommendations,
    transformImage,
  } = useImageTransformations();

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      startTransition(async () => {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setTransformedUrl(null);
        setRecommendations([]);
        setRecommendationError(null);
        setIsGettingRecs(true);
        try {
          const dataUri = await fileToDataUri(file);
          const result = await getRecommendations(dataUri);
          setRecommendations(result);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Could not get recommendations.';
          setRecommendationError(errorMessage);
          toast({
            variant: 'destructive',
            title: 'Recommendation Failed',
            description: 'See error details below the image.',
          });
        } finally {
          setIsGettingRecs(false);
        }
      });
    }
  };

  const handleTransform = async () => {
    if (!selectedFile) return;

    const isAuthenticated = await ensureAuthenticated();
    if (!isAuthenticated) {
        toast({
            variant: 'destructive',
            title: 'Authentication Required',
            description: 'Please sign in to transform images.',
        });
        return;
    }

    setTransformedUrl(null);

    const transformType = TRANSFORMATION_TYPES.find(
      t => t.id === selectedTransform
    );
    
    if(!transformType) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Invalid transformation type selected.',
      });
      return;
    }

    try {
        const resultUrl = await transformImage({
            file: selectedFile,
            transformType: transformType.id,
            prompt: userPrompt,
            requiresPrompt: !!transformType.requiresPrompt,
            label: transformType.label
        });
        setTransformedUrl(resultUrl);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        variant: 'destructive',
        title: 'Transformation Error',
        description: `An unexpected error occurred: ${errorMessage}`,
      });
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setTransformedUrl(null);
    setRecommendations([]);
    setRecommendationError(null);
    setUserPrompt('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const currentTransform = TRANSFORMATION_TYPES.find(
    t => t.id === selectedTransform
  );

  const handleChooseImageClick = () => {
    fileInputRef.current?.click();
  };

  const displayedHistory = history.length > 0 ? history : initialHistory;

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      {!previewUrl ? (
        <div className="text-center">
          <Card className="max-w-xl mx-auto shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-3xl">
                Upload Your Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4 p-8 border-2 border-dashed border-border rounded-lg">
                <Upload className="w-16 h-16 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Click the button to select an image from your device.
                </p>
                <Button
                  size="lg"
                  onClick={handleChooseImageClick}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  Choose Image
                </Button>
              </div>
            </CardContent>
          </Card>
          <HistoryGallery history={displayedHistory} />
        </div>
      ) : (
        <div>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">
                  Your Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video rounded-lg overflow-hidden border">
                  <Image
                    src={previewUrl}
                    alt="Selected preview"
                    fill
                    className="object-contain"
                  />
                </div>
                 {recommendationError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Recommendation Failed</AlertTitle>
                    <AlertDescription>
                      You can copy the error message below for support.
                      <Textarea
                        className="w-full mt-2 font-mono text-xs"
                        readOnly
                        value={recommendationError}
                        rows={4}
                      />
                    </AlertDescription>
                  </Alert>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reset}
                  className="mt-4"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Start Over
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">
                  Transformation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-lg font-medium">
                    Choose Transformation
                  </Label>
                  {isGettingRecs && (
                    <div className="flex items-center text-sm text-muted-foreground mt-2">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing image for recommendations...
                    </div>
                  )}
                  <RadioGroup
                    value={selectedTransform}
                    onValueChange={setSelectedTransform}
                    className="mt-2 grid grid-cols-2 gap-2"
                  >
                    {TRANSFORMATION_TYPES.map(type => (
                      <div key={type.id} className="relative">
                        <Label
                          htmlFor={type.id}
                          className={`flex items-center p-3 rounded-md border-2 cursor-pointer transition-colors ${
                            selectedTransform === type.id
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <RadioGroupItem value={type.id} id={type.id} />
                          <span className="ml-3 font-medium">{type.label}</span>
                        </Label>
                        {recommendations.includes(type.id) && (
                          <Badge
                            variant="secondary"
                            className="absolute -top-2 -right-2 text-accent-foreground bg-accent pointer-events-none"
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            Rec
                          </Badge>
                        )}
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {currentTransform?.requiresPrompt && (
                  <div>
                    <Label htmlFor="prompt" className="text-lg font-medium">
                      Style Prompt
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Describe the style you want to apply (e.g., "Van Gogh painting", "Cyberpunk").
                    </p>
                    <Input
                      id="prompt"
                      value={userPrompt}
                      onChange={e => setUserPrompt(e.target.value)}
                      placeholder="e.g., in the style of a comic book"
                    />
                  </div>
                )}

                <Button
                  size="lg"
                  onClick={handleTransform}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  Transform Image
                </Button>
                {isProcessing && <Progress value={progress} className="w-full" />}
              </CardContent>
            </Card>
          </div>

          {isProcessing && !transformedUrl && (
             <Card className="mt-8 shadow-xl">
              <CardHeader>
                <CardTitle className="font-headline text-3xl text-center">
                  Generating new image...
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center items-center flex-col gap-4">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <p className="text-muted-foreground">This may take a moment.</p>
              </CardContent>
            </Card>
          )}

          {transformedUrl && (
            <Card className="mt-8 shadow-xl">
              <CardHeader>
                <CardTitle className="font-headline text-3xl text-center">
                  Transformation Result
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="relative aspect-video w-full max-w-2xl rounded-lg overflow-hidden border-2 border-primary">
                  <Image
                    src={transformedUrl}
                    alt="Transformed result"
                    fill
                    className="object-contain"
                  />
                </div>
              </CardContent>
            </Card>
          )}
          <HistoryGallery history={displayedHistory} />
        </div>
      )}
    </div>
  );
}
