import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertStartupSchema } from "@shared/schema";

// Categories for startups
const CATEGORIES = [
  "Fintech",
  "Health Tech",
  "AI & ML",
  "Blockchain",
  "Clean Energy",
  "EdTech",
  "E-commerce",
  "SaaS"
];

// Funding stages
const FUNDING_STAGES = [
  "Pre-seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C+"
];

// Create a schema for our form
const formSchema = insertStartupSchema.omit({ userId: true }).extend({
  // Add additional validation
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(30, "Description must be at least 30 characters"),
  fundingGoal: z.coerce.number().min(1, "Funding goal must be at least 1"),
});

type CreateStartupFormData = z.infer<typeof formSchema>;

type CreateStartupComponentProps = {
  userId?: number;
};

export function CreateStartupComponent({ userId }: CreateStartupComponentProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateStartupFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "Blockchain",
      fundingStage: "Seed",
      location: "",
      fundingGoal: 100,
      logoUrl: "",
      pitchDeckUrl: "",
    },
  });

  const createStartupMutation = useMutation({
    mutationFn: async (data: CreateStartupFormData & { userId: number }) => {
      const response = await apiRequest("POST", "/api/startups", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Startup Created",
        description: "Your startup profile has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/startup`] });
      queryClient.invalidateQueries({ queryKey: ["/api/startups"] });
      setIsSubmitting(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create startup profile",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  async function onSubmit(data: CreateStartupFormData) {
    if (!userId) {
      toast({
        title: "Error",
        description: "You need to be logged in to create a startup",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    createStartupMutation.mutate({ ...data, userId });
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Your Startup Profile</CardTitle>
        <CardDescription>
          Fill in the details about your startup to create your profile and start raising funds.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Startup Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your startup name" value={field.value || ""} onChange={field.onChange} name={field.name} ref={field.ref} onBlur={field.onBlur} />
                  </FormControl>
                  <FormDescription>The name of your startup or project.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>The industry or sector of your startup.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fundingStage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funding Stage</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select funding stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FUNDING_STAGES.map((stage) => (
                          <SelectItem key={stage} value={stage}>
                            {stage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Your startup's current funding stage.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="City, Country" value={field.value || ""} onChange={field.onChange} name={field.name} ref={field.ref} onBlur={field.onBlur} />
                  </FormControl>
                  <FormDescription>Where your startup is based.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your startup, its mission, vision, and what problem you're solving..."
                      className="min-h-32"
                      value={field.value || ""}
                      onChange={field.onChange}
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a detailed description of your startup, its mission, and value proposition.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fundingGoal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funding Goal (ETH)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" value={field.value?.toString() || ""} onChange={field.onChange} name={field.name} ref={field.ref} onBlur={field.onBlur} />
                  </FormControl>
                  <FormDescription>
                    The amount of ETH you aim to raise through this platform.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/logo.png" value={field.value || ""} onChange={field.onChange} name={field.name} ref={field.ref} onBlur={field.onBlur} />
                  </FormControl>
                  <FormDescription>A URL pointing to your startup's logo.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pitchDeckUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pitch Deck URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/pitch-deck.pdf" value={field.value || ""} onChange={field.onChange} name={field.name} ref={field.ref} onBlur={field.onBlur} />
                  </FormControl>
                  <FormDescription>A URL to your startup's pitch deck or presentation.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Startup Profile"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}