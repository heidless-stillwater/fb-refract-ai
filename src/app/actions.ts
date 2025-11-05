'use server';

import { generateTransformationPrompt } from '@/ai/flows/generate-transformation-prompt';
import { recommendTransformationType } from '@/ai/flows/recommend-transformation-type';
import { transformImage } from '@/ai/flows/transform-image';
import { z } from 'zod';

const recommendSchema = z.object({
  photoDataUri: z.string().startsWith('data:image/'),
});

export async function getTransformationRecommendations(formData: { photoDataUri: string }) {
  const validatedData = recommendSchema.safeParse(formData);

  if (!validatedData.success) {
    throw new Error('Invalid image data format.');
  }

  const result = await recommendTransformationType({
    photoDataUri: validatedData.data.photoDataUri,
  });

  return result.transformationTypes;
}

const generatePromptSchema = z.object({
  userPrompt: z.string().min(3).max(200),
});

export async function getGeneratedPrompt(formData: { userPrompt: string }) {
  const validatedData = generatePromptSchema.safeParse(formData);

  if (!validatedData.success) {
    throw new Error('Invalid prompt. It must be between 3 and 200 characters.');
  }

  const result = await generateTransformationPrompt({
    userPrompt: validatedData.data.userPrompt,
  });

  return result.transformationPrompt;
}

const transformImageSchema = z.object({
  photoDataUri: z.string().startsWith('data:image/'),
  prompt: z.string(),
});

export async function getTransformedImage(formData: { photoDataUri:string, prompt: string }) {
  const validatedData = transformImageSchema.safeParse(formData);

  if (!validatedData.success) {
    throw new Error('Invalid input for transformation.');
  }

  const result = await transformImage({
    photoDataUri: validatedData.data.photoDataUri,
    prompt: validatedData.data.prompt,
  });

  return result.transformedPhotoDataUri;
}

const downloadImageSchema = z.object({
  imageUrl: z.string().url(),
});

export async function downloadImage(formData: { imageUrl: string }): Promise<string> {
    const validatedData = downloadImageSchema.safeParse(formData);

    if (!validatedData.success) {
      throw new Error('Invalid image URL provided.');
    }

    try {
      const response = await fetch(validatedData.data.imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const mimeType = response.headers.get('content-type') || 'application/octet-stream';
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while downloading the image.';
      throw new Error(errorMessage);
    }
}
