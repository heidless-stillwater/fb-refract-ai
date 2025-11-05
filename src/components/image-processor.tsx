'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useImageTransformations } from '@/hooks/use-image-transformations';
import {
  Loader2,
  Upload,
  Sparkles,
  Wand2,
  Download,
  Info,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { HistoryGallery } from './history-gallery';
import { downloadImage } from '@/app/actions';

const transformationOptions = [
  {
    value: 'modernize_interior',
    label: 'Modernize Interior',
    requiresPrompt: false,
  },
  {
    value: 'add_houseplants',
    label: 'Add Houseplants',
    requiresPrompt: false,
  },
  {
    value: 'bohemian_style',
    label: 'Bohemian Style',
    requiresPrompt: false,
  },
  {
    value: 'minimalist_style',
    label: 'Minimalist Style',
    requiresPrompt: false,
  },
  {
    value: 'professional_style',
    label: 'Professional Lighting',
    requiresPrompt: false,
  },
  { value: 'custom', label: 'Custom Prompt', requiresPrompt: true },
];

const DownloadableImage = ({ src, alt, filename }: { src: string; alt: string; filename: string }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const dataUri = await downloadImage({ imageUrl: src });
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Could not download the file.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[250px] group">
      <Image
        src={src}
        alt={alt}
        layout="fill"
        objectFit="contain"
        className="rounded-md"
      />
      <div
        className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-md cursor-pointer"
        onClick={handleDownload}
      >
        {isDownloading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Download className="w-8 h-8" />}
      </div>
    </div>
  );
};


export default function ImageProcessor() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [transformedUrl, setTransformedUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [selectedTransform, setSelectedTransform] = useState(
    transformationOptions[0]
  );
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isFetchingRecommendations, setIsFetchingRecommendations] =
    useState(false);

  const {
    history,
    isProcessing,
    progress,
    getRecommendations,
    transformImage,
  } = useImageTransformations();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const selectedOption = useMemo(
    () =>
      transformationOptions.find(
        opt => opt.value === selectedTransform.value
      )!,
    [selectedTransform]
  );

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      setTransformedUrl(null);
      setRecommendations([]);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    setTransformedUrl(null); // Clear previous transformation
    fetchRecommendations(selectedFile);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  useEffect(() => {
    if (!selectedOption.requiresPrompt) {
      setPrompt('');
    }
  }, [selectedOption]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File Too Large',
          description: 'Please select an image smaller than 4MB.',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const fetchRecommendations = async (file: File) => {
    if (!file) return;
    setIsFetchingRecommendations(true);
    setRecommendations([]);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUri = reader.result as string;
        const recs = await getRecommendations(dataUri);
        setRecommendations(recs);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not get recommendations',
        description:
          error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsFetchingRecommendations(false);
    }
  };

  const handleTransform = async () => {
    if (!selectedFile) {
      toast({
        variant: 'destructive',
        title: 'No Image Selected',
        description: 'Please upload an image to transform.',
      });
      return;
    }
    if (selectedOption.requiresPrompt && !prompt) {
      toast({
        variant: 'destructive',
        title: 'Prompt Required',
        description: 'A text prompt is required for this transformation.',
      });
      return;
    }
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'Please log in to transform images.',
      });
      return;
    }

    try {
      setTransformedUrl(null);
      const resultDataUri = await transformImage({
        file: selectedFile,
        transformType: selectedOption.value,
        prompt,
        requiresPrompt: selectedOption.requiresPrompt,
        label: selectedOption.label,
      });
      setTransformedUrl(resultDataUri);
      toast({
        title: 'Transformation Complete!',
        description: 'Your image has been successfully transformed.',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Transformation Failed',
        description: errorMessage,
      });
    }
  };

  const canTransform = selectedFile && !isProcessing && !isUserLoading;

  return (
    <div className="space-y-16">
      <Card className="shadow-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="font-headline text-3xl flex items-center gap-2">
            <Wand2 className="text-primary" /> AI Image Transformer
          </CardTitle>
          <CardDescription>
            Upload an image of a room and watch our AI redecorate it based on
            your chosen style.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Input Column */}
            <div className="space-y-6">
              <div
                className="relative border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors min-h-[250px] flex flex-col items-center justify-center bg-muted/20"
              >
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isProcessing}
                />
                {previewUrl && selectedFile ? (
                  <DownloadableImage
                    src={previewUrl}
                    alt="Selected preview"
                    filename={selectedFile.name}
                  />
                ) : (
                  <label htmlFor='file-upload' className="flex flex-col items-center justify-center text-muted-foreground cursor-pointer">
                    <Upload className="h-12 w-12 mb-4" />
                    <span className="font-semibold">Click to upload an image</span>
                    <span className="text-sm">PNG, JPG, GIF up to 4MB</span>
                  </label>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="transform-select">Transformation Style</Label>
                <Select
                  value={selectedTransform.value}
                  onValueChange={value =>
                    setSelectedTransform(
                      transformationOptions.find(opt => opt.value === value)!
                    )
                  }
                  disabled={!canTransform}
                >
                  <SelectTrigger id="transform-select">
                    <SelectValue placeholder="Select a style" />
                  </SelectTrigger>
                  <SelectContent>
                    {transformationOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedOption.requiresPrompt && (
                <div className="space-y-2">
                  <Label htmlFor="prompt-input">Custom Prompt</Label>
                  <Textarea
                    id="prompt-input"
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="e.g., 'A futuristic room with neon lights'"
                    disabled={!canTransform}
                    className="h-24"
                  />
                </div>
              )}

              {recommendations.length > 0 && (
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Sparkles className="text-accent" /> AI Recommendations
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {recommendations.map(rec => (
                      <Badge
                        key={rec}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary/20"
                        onClick={() => {
                          setSelectedTransform({
                            value: 'custom',
                            label: 'Custom Prompt',
                            requiresPrompt: true,
                          });
                          setPrompt(rec);
                        }}
                      >
                        {rec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
               {isFetchingRecommendations && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="animate-spin" /> Getting AI recommendations...</div>}


              <Button
                onClick={handleTransform}
                disabled={!canTransform}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Wand2 />
                )}
                Transform Image
              </Button>

              {isProcessing && (
                <div className="space-y-2">
                   <Progress value={progress} className="w-full" />
                   <p className="text-sm text-muted-foreground text-center animate-pulse">
                     AI is thinking... this can take up to 30 seconds.
                   </p>
                </div>
              )}
            </div>

            {/* Output Column */}
            <div className="relative border-2 border-border rounded-lg min-h-[400px] flex items-center justify-center bg-muted/20 overflow-hidden">
              {isProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                  <p className="mt-4 text-lg font-semibold text-muted-foreground">
                    Transforming...
                  </p>
                </div>
              )}
              {!transformedUrl && !isProcessing && (
                <div className="text-center text-muted-foreground p-8">
                   <Sparkles className="h-12 w-12 mx-auto mb-4" />
                   <h3 className="font-semibold text-lg">Your transformed image will appear here.</h3>
                   <p className="text-sm">Upload an image and choose a style to get started.</p>
                </div>
              )}
              {transformedUrl && selectedFile && (
                 <DownloadableImage
                    src={transformedUrl}
                    alt="Transformed image"
                    filename={`transformed-${selectedFile.name}`}
                  />
              )}
            </div>
          </div>
            {!user && !isUserLoading && (
                <Alert variant="destructive">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Anonymous Mode</AlertTitle>
                  <AlertDescription>
                    You are not signed in. Your transformation history will not be saved. Sign up to save your creations.
                  </AlertDescription>
                </Alert>
            )}
        </CardContent>
      </Card>
      
      {user && <HistoryGallery history={history} />}
    </div>
  );
}
