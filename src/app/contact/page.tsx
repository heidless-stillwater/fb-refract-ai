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
import { Loader2, Send, Mail, User as UserIcon } from 'lucide-react';
import { submitContactForm } from '@/app/actions';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

const contactFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  message: z
    .string()
    .min(10, { message: 'Message must be at least 10 characters.' })
    .max(500, { message: 'Message must not exceed 500 characters.' }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

function MessageList() {
  const firestore = useFirestore();
  const messagesQuery = useMemoFirebase(
    () =>
      query(
        collection(firestore, 'dnd_contactMessages'),
        orderBy('submittedAt', 'desc'),
        limit(20)
      ),
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
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true);
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const result = await submitContactForm(formData);

    if (result.success) {
      toast({
        title: 'Message Sent!',
        description: "Thanks for reaching out. We've received your message.",
      });
      form.reset();
    } else {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: result.error || 'An unexpected error occurred. Please try again.',
      });
    }

    setIsSubmitting(false);
  };

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
