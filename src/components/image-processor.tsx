'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUser } from '@/firebase';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const styleOptions = [
  'gothic',
  'art deco',
  'minimalistic',
  'van gogh style',
  'rembrandt style',
  'pop',
  'cosy',
];

export default function ImageProcessor() {
  const [selectedStyle, setSelectedStyle] = useState<string>('art deco');
  const [prompt, setPrompt] = useState<string>('art deco');
  const [isTestMode, setIsTestMode] = useState<boolean>(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    setPrompt(selectedStyle);
  }, [selectedStyle]);

  const handleStyleChange = (value: string) => {
    setSelectedStyle(value);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please select an image file to upload.',
      });
      return;
    }

    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'You must be logged in to upload an image.',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const storage = getStorage();
    const filePath = `user-uploads/${
      user.uid
    }/${Date.now()}-original-${selectedFile.name}`;
    const storageRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error('Upload failed:', error);
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: `An error occurred while uploading: ${error.message}`,
        });
        setIsUploading(false);
        setUploadProgress(null);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          toast({
            title: 'Upload Successful',
            description: `Image uploaded and available at: ${downloadURL}`,
          });
          // Here you would typically save the downloadURL to Firestore
          // or use it to trigger the AI transformation.
        } catch (error) {
          console.error('Failed to get download URL:', error);
          toast({
            variant: 'destructive',
            title: 'Processing Failed',
            description: 'Failed to get the image URL after upload.',
          });
        } finally {
          setIsUploading(false);
          setUploadProgress(null);
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="file-upload">Image File</Label>
        <Input
          id="file-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="style-select">Style</Label>
        <Select
          value={selectedStyle}
          onValueChange={handleStyleChange}
          disabled={isUploading}
        >
          <SelectTrigger id="style-select">
            <SelectValue placeholder="Select a style" />
          </SelectTrigger>
          <SelectContent>
            {styleOptions.map((style) => (
              <SelectItem key={style} value={style} className="capitalize">
                {style}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prompt-input">Prompt</Label>
        <Input
          id="prompt-input"
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isUploading}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="test-mode"
          checked={isTestMode}
          onCheckedChange={(checked) => setIsTestMode(checked as boolean)}
          disabled={isUploading}
        />
        <Label htmlFor="test-mode" className="font-normal">
          Test mode
        </Label>
      </div>
      
      {uploadProgress !== null && (
        <Progress value={uploadProgress} className="w-full" />
      )}

      <div>
        <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
          {isUploading ? (
            <Loader2 className="animate-spin" />
          ) : null}
          {isUploading ? 'Uploading...' : 'Upload Images'}
        </Button>
      </div>
    </div>
  );
}
