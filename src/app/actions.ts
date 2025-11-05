'use server';

import {
  generateTransformationPrompt,
  GenerateTransformationPromptInput,
} from '@/ai/flows/generate-transformation-prompt';
import {
  recommendTransformationType,
  RecommendTransformationTypeInput,
} from '@/ai/flows/recommend-transformation-type';
import { transformImage, TransformImageInput } from '@/ai/flows/transform-image';
import { z } from 'zod';

const recommendSchema = z.object({
  photoDataUri: z.string().startsWith('data:image/'),
});

export async function getTransformationRecommendations(
  input: RecommendTransformationTypeInput
) {
  try {
    const validatedData = recommendSchema.safeParse(input);

    if (!validatedData.success) {
      throw new Error('Invalid image data format.');
    }

    const result = await recommendTransformationType({
      photoDataUri: validatedData.data.photoDataUri,
    });

    return result.transformationTypes;
  } catch (error) {
    console.error('Error in getTransformationRecommendations:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    throw new Error(errorMessage);
  }
}

const generatePromptSchema = z.object({
  userPrompt: z.string().min(3).max(200),
});

export async function getGeneratedPrompt(
  input: GenerateTransformationPromptInput
) {
  try {
    const validatedData = generatePromptSchema.safeParse(input);

    if (!validatedData.success) {
      throw new Error('Invalid prompt. It must be between 3 and 200 characters.');
    }

    const result = await generateTransformationPrompt({
      userPrompt: validatedData.data.userPrompt,
    });

    return result.transformationPrompt;
  } catch (error) {
    console.error('Error in getGeneratedPrompt:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    throw new Error(errorMessage);
  }
}

const transformImageSchema = z.object({
  photoDataUri: z.string().startsWith('data:image/'),
  prompt: z.string(),
});

export async function getTransformedImage(input: TransformImageInput) {
  try {
    const validatedData = transformImageSchema.safeParse(input);

    if (!validatedData.success) {
      throw new Error('Invalid input for transformation.');
    }

    const result = await transformImage({
      photoDataUri: validatedData.data.photoDataUri,
      prompt: validatedData.data.prompt,
    });

    return result.transformedPhotoDataUri;
  } catch (error) {
    console.error('Error in getTransformedImage:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    throw new Error(errorMessage);
  }
}
