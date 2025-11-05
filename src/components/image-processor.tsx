'use client';

import { useState, useRef, useEffect } from 'react';
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="file-upload">Image File</Label>
        <Input 
          id="file-upload" 
          type="file" 
          accept="image/*"
          onChange={handleFileChange} 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="style-select">Style</Label>
        <Select value={selectedStyle} onValueChange={handleStyleChange}>
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
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="test-mode"
          checked={isTestMode}
          onCheckedChange={(checked) => setIsTestMode(checked as boolean)}
        />
        <Label htmlFor="test-mode" className="font-normal">
          Test mode
        </Label>
      </div>

      <div>
        <Button disabled={!selectedFile}>
          Upload Images
        </Button>
      </div>
    </div>
  );
}
