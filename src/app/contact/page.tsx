'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  Send,
  Mail,
  User as UserIcon,
  Paperclip,
  File as FileIcon,
  X,
  Download,
} from 'lucide-react';
import {
  useFirestore,
  useMemoFirebase,
  addDocumentNonBlocking,
  useCollection,
} from '@/firebase';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useAuthGate } from '@/hooks/use-auth-gate';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';
import { downloadImage } from '@/app/actions';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const contactFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  message: z
    .string()
    .min(10, { message: 'Message must be at least 10 characters.' })
    .max(500, { message: 'Message must not exceed 500 characters.' }),
  attachment: z
    .custom<FileList>()
    .optional()
    .refine(
      files => !files || files.length === 0 || files[0].size <= MAX_FILE_SIZE,
      `Max file size is 5MB.`
    ),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const DownloadableAttachment = ({ url, filename }: { url: string; filename: string }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  const isImage = /\.(jpg|jpeg|png|gif)$/i.test(filename);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const dataUri = await downloadImage({ imageUrl: url });
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Could not download the file.',
      });
    } finally {
      setIsDownloading(false);
    }
  };


  if (isImage) {
    return (
      <div className="relative w-48 h-32 rounded-lg overflow-hidden border group">
        <Image src={url} alt={filename} layout="fill" objectFit="cover" />
        <div
          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          onClick={handleDownload}
        >
          {isDownloading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
        </div>
      </div>
    );
  }

  return (
    <Button onClick={handleDownload} disabled={isDownloading} variant="outline" size="sm">
       {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
       {isDownloading ? 'Downloading...' : filename}
    </Button>
  );
};

function MessageList() {
  const firestore = useFirestore();
  const messagesQuery = useMemoFirebase(
    () =>
      firestore
        ? query(
            collection(firestore, 'dnd_contactMessages'),
            orderBy('submittedAt', 'desc'),
            limit(20)
          )
        : null,
    [firestore]
  );
  const { data: messages, isLoading } = useCollection<any>(messagesQuery);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-24">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return <p className="text-center text-muted-foreground mt-4">No messages yet.</p>;
  }

  return (
    <div className="space-y-4">
      {messages.map(msg => (
        <Card key={msg.id} className="shadow-sm">
          <CardContent className="p-4 flex gap-4">
            <Avatar>
              <AvatarFallback>
                {msg.name?.[0].toUpperCase() ?? <UserIcon />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <p className="font-semibold">{msg.name}</p>
                <p className="text-xs text-muted-foreground">
                  {msg.submittedAt?.toDate
                    ? formatDistanceToNow(msg.submittedAt.toDate(), { addSuffix: true })
                    : ''}
                </p>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" /> {msg.email}
              </p>
              <p className="mt-2 text-foreground">{msg.message}</p>
              {msg.attachmentURL && msg.attachmentFilename && (
                 <div className="mt-4">
                  <DownloadableAttachment url={msg.attachmentURL} filename={msg.attachmentFilename} />
                 </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const storage = getStorage();
  const { ensureAuthenticated } = useAuthGate();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  });

  const attachmentFile = form.watch('attachment');

  const onSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true);
    setUploadProgress(null);

    const isAuthenticated = await ensureAuthenticated();
    if (!isAuthenticated) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please sign in to send a message.',
      });
      setIsSubmitting(false);
      return;
    }

    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Database connection not available. Please try again later.',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      let attachmentURL: string | null = null;
      let attachmentFilename: string | null = null;
      const file = values.attachment?.[0];

      if (file) {
        setUploadProgress(0);
        const storageRef = ref(
          storage,
          `dnd_contactAttachments/${new Date().toISOString()}_${file.name}`
        );
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            snapshot => {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            error => {
              reject(new Error(`File upload failed: ${error.message}`));
            },
            async () => {
              attachmentURL = await getDownloadURL(uploadTask.snapshot.ref);
              attachmentFilename = file.name;
              resolve();
            }
          );
        });
      }

      const messagesCollection = collection(firestore, 'dnd_contactMessages');
      const messageData: any = {
        name: values.name,
        email: values.email,
        message: values.message,
        submittedAt: new Date(),
      };

      if (attachmentURL) {
        messageData.attachmentURL = attachmentURL;
        messageData.attachmentFilename = attachmentFilename;
      }
      
      await addDocumentNonBlocking(messagesCollection, messageData);

      toast({
        title: 'Message Sent!',
        description: "Thanks for reaching out. We've received your message.",
      });
      form.reset();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };
  
  const clearAttachment = () => {
    form.setValue('attachment', undefined);
  }

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4 grid md:grid-cols-2 gap-12 items-start">
      <div>
        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Contact Us</CardTitle>
            <CardDescription>
              Have a question or feedback? Fill out the form below to get in touch.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Your message..."
                          className="resize-none"
                          rows={6}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="attachment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attachment (Optional)</FormLabel>
                      <FormControl>
                         <div className="relative">
                          <Input
                            type="file"
                            className="hidden"
                            id="attachment-input"
                            onChange={e => field.onChange(e.target.files)}
                          />
                          <label
                            htmlFor="attachment-input"
                            className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors flex flex-col items-center justify-center text-muted-foreground"
                          >
                           {attachmentFile?.[0] ? (
                              <div className="flex items-center gap-2">
                                <FileIcon/>
                                <span>{attachmentFile[0].name}</span>
                                <Button variant="ghost" size="icon" onClick={(e) => {e.preventDefault(); clearAttachment();}} className="h-6 w-6">
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                               <>
                                <Paperclip className="h-8 w-8 mb-2" />
                                <span>Click or drag to attach a file</span>
                               </>
                            )}
                          </label>
                         </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                 {uploadProgress !== null && (
                  <Progress value={uploadProgress} className="w-full" />
                )}

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Send />
                  )}
                  Send Message
                </Button>
              </CardContent>
            </form>
          </Form>
        </Card>
      </div>
      <div>
        <h2 className="font-headline text-3xl mb-6">Recent Messages</h2>
        <MessageList />
      </div>
    </div>
  );
}
