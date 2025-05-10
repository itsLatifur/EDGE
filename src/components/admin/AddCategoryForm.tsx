// src/components/admin/AddCategoryForm.tsx
"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Loader2 } from 'lucide-react';
import type { CategoryTab } from '@/lib/constants';
import { AVAILABLE_ICONS_FOR_TABS, LUCIDE_ICON_MAP } from '@/lib/constants';
import { useState } from 'react';

const categorySchema = z.object({
  id: z.string().min(2, { message: "ID must be at least 2 characters" }).regex(/^[a-z0-9-]+$/, { message: "ID can only contain lowercase letters, numbers, and hyphens" }),
  label: z.string().min(2, { message: "Label must be at least 2 characters" }),
  iconName: z.enum(AVAILABLE_ICONS_FOR_TABS, { errorMap: () => ({ message: "Please select an icon" }) }),
});

type CategoryFormInputs = z.infer<typeof categorySchema>;

interface AddCategoryFormProps {
  onCategoryAdded: (category: CategoryTab) => void;
  existingCategories: CategoryTab[];
}

export function AddCategoryForm({ onCategoryAdded, existingCategories }: AddCategoryFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CategoryFormInputs>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      id: "",
      label: "",
      iconName: undefined,
    },
  });

  const onSubmit: SubmitHandler<CategoryFormInputs> = async (data) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));

    if (existingCategories.find(cat => cat.id === data.id || cat.label.toLowerCase() === data.label.toLowerCase())) {
      toast({
        title: "Error",
        description: "A category with this ID or label already exists.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    const IconComponent = LUCIDE_ICON_MAP[data.iconName];
    const newCategory: CategoryTab = {
      id: data.id,
      label: data.label,
      icon: IconComponent,
    };

    onCategoryAdded(newCategory); // Update parent state
    toast({ title: "Category Added", description: `Category "${data.label}" has been successfully created.` });
    form.reset();
    setIsLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Label</FormLabel>
              <FormControl>
                <Input placeholder="e.g., React Hooks" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category ID</FormLabel>
              <FormControl>
                <Input placeholder="e.g., react-hooks (unique, no spaces)" {...field} 
                  onChange={(e) => field.onChange(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="iconName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an icon" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {AVAILABLE_ICONS_FOR_TABS.map(iconName => {
                    const Icon = LUCIDE_ICON_MAP[iconName];
                    return (
                      <SelectItem key={iconName} value={iconName}>
                        <div className="flex items-center">
                          <Icon className="mr-2 h-4 w-4" />
                          {iconName}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
          Add Category
        </Button>
      </form>
    </Form>
  );
}
