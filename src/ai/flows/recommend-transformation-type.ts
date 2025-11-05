'use server';

/**
 * @fileOverview An AI agent that recommends image transformation types based on the uploaded image content.
 *
 * - recommendTransformationType - A function that recommends transformation types for a given image.
 * - RecommendTransformationTypeInput - The input type for the recommendTransformationType function.
 * - RecommendTransformationTypeOutput - The return type for the recommendTransformationType function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendTransformationTypeInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Corrected typo here
    ),
});
export type RecommendTransformationTypeInput = z.infer<
  typeof RecommendTransformationTypeInputSchema
>;

const RecommendTransformationTypeOutputSchema = z.object({
  transformationTypes: z
    .array(z.string())
    .describe('An array of recommended image transformation types.'),
});
export type RecommendTransformationTypeOutput = z.infer<
  typeof RecommendTransformationTypeOutputSchema
>;

export async function recommendTransformationType(
  input: RecommendTransformationTypeInput
): Promise<RecommendTransformationTypeOutput> {
  return recommendTransformationTypeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendTransformationTypePrompt',
  input: {schema: RecommendTransformationTypeInputSchema},
  output: {schema: RecommendTransformationTypeOutputSchema},
  prompt: `You are an AI assistant that recommends image transformation types based on the content of the uploaded image.

  Analyze the image provided and suggest relevant transformation types that would enhance or modify the image in interesting ways. Consider factors like the objects present in the image, the overall style, and potential artistic effects that could be applied.

  Here is the image:
  {{media url=photoDataUri}}

  Respond with a JSON array of transformation types. Some examples of transformations are style transfer, background removal, artistic rendering, color enhancement, and object highlighting.
  The output must be a JSON array of strings.
  `,
});

const recommendTransformationTypeFlow = ai.defineFlow(
  {
    name: 'recommendTransformationTypeFlow',
    inputSchema: RecommendTransformationTypeInputSchema,
    outputSchema: RecommendTransformationTypeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
