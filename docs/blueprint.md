# **App Name**: Refract AI

## Core Features:

- Image Upload and Preview: Allows users to upload images from their device and preview them before applying transformations.
- AI Transformation Selection: Presents a selection of AI-powered image transformations (style transfer, background removal, artistic rendering).
- Cloud Function Integration: Utilizes Cloud Functions to send the images to AI APIs (e.g., Gemini, Stability AI) for processing.
- Real-time Progress Updates: Provides real-time feedback to the user during image transformation via on-screen progress indicators and/or Firestore updates.
- Transformed Image Display: Displays the transformed image after successful processing.
- Image History: Allows the user to view past results.
- Transformation Type Recommendation: Suggests suitable AI transformation types, relevant to a given image's contents, by analyzing its EXIF data or sending it to the cloud vision tool.

## Style Guidelines:

- Dark color scheme with a primary color of deep violet (#9400D3), evoking a sense of creativity and sophistication.
- Background color: Dark, desaturated violet (#2e004f).
- Accent color: Electric purple (#8F00FF), providing visual contrast and highlighting key elements.
- Font pairing: 'Space Grotesk' (sans-serif) for headers paired with 'Inter' (sans-serif) for body text. The header font gives a computerized, techy feel, while the body font will display longer amounts of text.
- Use simple, modern icons to represent image transformation options.
- Minimalist design with a focus on central image display and clear transformation options.
- Subtle animations for loading and transformation processes.