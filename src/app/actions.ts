'use server';

import { generateTransformationPrompt } from '@/ai/flows/generate-transformation-prompt';
import { recommendTransformationType } from '@/ai/flows/recommend-transformation-type';
import { transformImage } from '@/ai/flows/transform-image';
import { z } from 'zod';

const recommendSchema = z.object({
  photoDataUri: z.string().startsWith('data:image/'),
});

export async function getTransformationRecommendations(formData: { photoDataUri: string }) {
  try {
    const validatedData = recommendSchema.safeParse(formData);

    if (!validatedData.success) {
      throw new Error('Invalid image data format.');
    }

    const result = await recommendTransformationType({
      photoDataUri: validatedData.data.photoDataUri,
    });

    return result.transformationTypes;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    throw new Error(errorMessage);
  }
}

const generatePromptSchema = z.object({
  userPrompt: z.string().min(3).max(200),
});

export async function getGeneratedPrompt(formData: { userPrompt: string }) {
  try {
    const validatedData = generatePromptSchema.safeParse(formData);

    if (!validatedData.success) {
      throw new Error('Invalid prompt. It must be between 3 and 200 characters.');
    }

    const result = await generateTransformationPrompt({
      userPrompt: validatedData.data.userPrompt,
    });

    return result.transformationPrompt;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    throw new Error(errorMessage);
  }
}

const transformImageSchema = z.object({
  photoDataUri: z.string().startsWith('data:image/'),
  prompt: z.string(),
});

export async function getTransformedImage(formData: { photoDataUri: string, prompt: string }) {
  try {
    const validatedData = transformImageSchema.safeParse(formData);

    if (!validatedData.success) {
      throw new Error('Invalid input for transformation.');
    }

    const result = await transformImage({
      photoDataUri: validatedData.data.photoDataUri,
      prompt: validatedData.data.prompt,
    });

    return result.transformedPhotoDataUri;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    throw new Error(errorMessage);
  }
}
