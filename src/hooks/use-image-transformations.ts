'use client';

import { useState, useEffect } from 'react';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import {
  getTransformationRecommendations,
  getGeneratedPrompt,
  getTransformedImage,
} from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { TransformationHistoryItem } from '@/components/history-gallery';

const fileToDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const dataUriToBlob = (dataUri: string) => {
  const byteString = atob(dataUri.split(',')[1]);
  const mimeString = dataUri.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};

type TransformImageParams = {
  file: File;
  transformType: string;
  prompt: string;
  requiresPrompt: boolean;
  label: string;
};

export function useImageTransformations() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const storage = getStorage();

  const transformationsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'transformedImages'),
      orderBy('createdAt', 'desc'),
      limit(10)
    )
  }, [user, firestore]);

  const { data: historyData } = useCollection<any>(transformationsQuery);

  const history: TransformationHistoryItem[] =
    historyData?.map(item => ({
      id: item.id,
      originalUrl: item.originalImageURL,
      transformedUrl: item.transformedImageURL,
      transformationType: item.transformationType,
      prompt: item.transformationParameters,
      originalHint: 'uploaded image',
      transformedHint: 'transformed image',
    })) || [];

  const getRecommendations = async (dataUri: string): Promise<string[]> => {
    const formData = new FormData();
    formData.append('photoDataUri', dataUri);
    const result = await getTransformationRecommendations(formData);
    if (result.success) {
      return result.recommendations;
    } else {
      throw new Error(
        result.error || 'An unknown error occurred while getting recommendations.'
      );
    }
  };

  const uploadFile = (
    file: File | Blob,
    path: string
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        snapshot => {
          // Optional: handle progress updates
        },
        error => {
          reject(new Error(`File upload failed: ${error.message}`));
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const transformImage = async ({
    file,
    transformType,
    prompt,
    requiresPrompt,
    label,
  }: TransformImageParams): Promise<string> => {
    setIsProcessing(true);
    setProgress(10);

    let finalPrompt = prompt;
    if (requiresPrompt && prompt) {
      const formData = new FormData();
      formData.append('userPrompt', prompt);
      const result = await getGeneratedPrompt(formData);
      if (result.success && result.prompt) {
        finalPrompt = result.prompt;
      }
    } else if (requiresPrompt && !prompt) {
      toast({
        variant: 'destructive',
        title: 'Prompt Required',
        description: 'This transformation type requires a prompt.',
      });
      setIsProcessing(false);
      throw new Error('Prompt required for this transformation.');
    } else {
        finalPrompt = label;
    }

    try {
      const dataUri = await fileToDataUri(file);
      setProgress(25);
      
      const transformFormData = new FormData();
      transformFormData.append('photoDataUri', dataUri);
      transformFormData.append('prompt', finalPrompt);
      const transformResult = await getTransformedImage(transformFormData);
      setProgress(50);

      if (!transformResult.success || !transformResult.transformedPhotoDataUri) {
        throw new Error(
          transformResult.error || 'Could not transform the image.'
        );
      }

      const originalFilePath = `dth-storage/${user!.uid}/${new Date().toISOString()}_original_${file.name}`;
      const transformedBlob = dataUriToBlob(transformResult.transformedPhotoDataUri);
      const transformedFilePath = `dth-storage/${user!.uid}/${new Date().toISOString()}_transformed_${file.name}`;
      
      setProgress(60);
      const [originalImageURL, transformedImageURL] = await Promise.all([
        uploadFile(file, originalFilePath),
        uploadFile(transformedBlob, transformedFilePath),
      ]);
      setProgress(90);

      await addDoc(collection(firestore, 'transformedImages'), {
        userId: user!.uid,
        originalImageURL,
        transformedImageURL,
        transformationType: label,
        transformationParameters: requiresPrompt ? finalPrompt : null,
        createdAt: new Date(),
      });
      setProgress(100);

      return transformResult.transformedPhotoDataUri;

    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast({
        variant: 'destructive',
        title: 'Transformation Error',
        description: `An unexpected error occurred: ${errorMessage}`,
      });
      throw error; // Re-throw to be caught by the component
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
      }, 500);
    }
  };

  return {
    history,
    isProcessing,
    progress,
    getRecommendations,
    transformImage,
  };
}
