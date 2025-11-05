'use server';

import { generateTransformationPrompt } from '@/ai/flows/generate-transformation-prompt';
import { recommendTransformationType } from '@/ai/flows/recommend-transformation-type';
import { z } from 'zod';

const recommendSchema = z.object({
  photoDataUri: z.string().startsWith('data:image/'),
});

export async function getTransformationRecommendations(formData: FormData) {
  try {
    const validatedData = recommendSchema.safeParse({
      photoDataUri: formData.get('photoDataUri'),
    });

    if (!validatedData.success) {
      return { success: false, error: 'Invalid image data format.' };
    }

    const result = await recommendTransformationType({
      photoDataUri: validatedData.data.photoDataUri,
    });

    return { success: true, recommendations: result.transformationTypes };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}

const generatePromptSchema = z.object({
  userPrompt: z.string().min(3).max(200),
});

export async function getGeneratedPrompt(formData: FormData) {
  try {
    const validatedData = generatePromptSchema.safeParse({
      userPrompt: formData.get('userPrompt'),
    });

    if (!validatedData.success) {
      return {
        success: false,
        error: 'Invalid prompt. It must be between 3 and 200 characters.',
      };
    }

    const result = await generateTransformationPrompt({
      userPrompt: validatedData.data.userPrompt,
    });

    return { success: true, prompt: result.transformationPrompt };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}
