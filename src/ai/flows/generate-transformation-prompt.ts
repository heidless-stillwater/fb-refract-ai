'use server';

/**
 * @fileOverview Generates a transformation prompt based on user input.
 *
 * - generateTransformationPrompt - A function that generates the transformation prompt.
 * - GenerateTransformationPromptInput - The input type for the generateTransformationPrompt function.
 * - GenerateTransformationPromptOutput - The return type for the generateTransformationPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTransformationPromptInputSchema = z.object({
  userPrompt: z.string().describe('The text prompt describing the desired image transformation.'),
});

export type GenerateTransformationPromptInput = z.infer<typeof GenerateTransformationPromptInputSchema>;

const GenerateTransformationPromptOutputSchema = z.object({
  transformationPrompt: z.string().describe('The generated transformation prompt for the AI model.'),
});

export type GenerateTransformationPromptOutput = z.infer<typeof GenerateTransformationPromptOutputSchema>;

export async function generateTransformationPrompt(
  input: GenerateTransformationPromptInput
): Promise<GenerateTransformationPromptOutput> {
  return generateTransformationPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTransformationPromptPrompt',
  input: {schema: GenerateTransformationPromptInputSchema},
  output: {schema: GenerateTransformationPromptOutputSchema},
  prompt: `You are an AI that generates transformation prompts for AI image generation models.  The user will provide a prompt that gives the desired result, and you should rephrase it so that it can be understood by the AI model. 

User Prompt: {{{userPrompt}}}`,
});

const generateTransformationPromptFlow = ai.defineFlow(
  {
    name: 'generateTransformationPromptFlow',
    inputSchema: GenerateTransformationPromptInputSchema,
    outputSchema: GenerateTransformationPromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
