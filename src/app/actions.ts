'use server';

import { generateTransformationPrompt } from '@/ai/flows/generate-transformation-prompt';
import { recommendTransformationType } from '@/ai/flows/recommend-transformation-type';
import { transformImage } from '@/ai/flows/transform-image';
import { z } from 'zod';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { initializeAdminApp } from '@/lib/firebase/admin';

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

const transformImageSchema = z.object({
  photoDataUri: z.string().startsWith('data:image/'),
  prompt: z.string(),
});

export async function getTransformedImage(formData: FormData) {
  try {
    const validatedData = transformImageSchema.safeParse({
      photoDataUri: formData.get('photoDataUri'),
      prompt: formData.get('prompt'),
    });

    if (!validatedData.success) {
      return { success: false, error: 'Invalid input for transformation.' };
    }

    const result = await transformImage({
      photoDataUri: validatedData.data.photoDataUri,
      prompt: validatedData.data.prompt,
    });

    return { success: true, transformedPhotoDataUri: result.transformedPhotoDataUri };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}

const contactFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }),
});

export async function submitContactForm(formData: FormData) {
  try {
    const validatedData = contactFormSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message'),
    });

    if (!validatedData.success) {
      const errorDetails = validatedData.error.issues
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
      return {
        success: false,
        error: `Invalid form data: ${errorDetails}`,
      };
    }
    
    // Server-side Firebase Admin initialization
    await initializeAdminApp();
    const firestore = getAdminFirestore();
    
    await firestore.collection('dnd_contactMessages').add({
      ...validatedData.data,
      submittedAt: new Date(),
    });

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected server error occurred.';
     return {
      success: false,
      error: errorMessage,
    };
  }
}
