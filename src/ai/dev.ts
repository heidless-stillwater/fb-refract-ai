import { config } from 'dotenv';
config();

import '@/ai/flows/generate-transformation-prompt.ts';
import '@/ai/flows/recommend-transformation-type.ts';
import '@/ai/flows/transform-image.ts';
