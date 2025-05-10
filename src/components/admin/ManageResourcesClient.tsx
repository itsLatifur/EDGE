// src/components/admin/ManageResourcesClient.tsx
"use client";

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, BookOpen as BookOpenIcon, Loader2, Link as LinkIcon } from 'lucide-react'; // Added LinkIcon
import type { CategoryTab, ResourceLink } from '@/lib/constants';
import { addCategory as addCategoryToMemory, addResourceLink as addResourceLinkToMemory, getCategories, getResourcesData } from '@/lib/constants';
import { AddCategoryForm } from './AddCategoryForm';

const resourceLinkTypes = ['documentation', 'article', 'tool', 'guide'] as const;

const resourceSchema = z.object({
  categoryId: z.string().min(1, { message: "Please select a category" }),
  title: z.string().min(3, { message: "Resource title is required" }),
  url: z.string().url({ message: "A valid URL is required" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  type: z.enum(resourceLinkTypes, { errorMap: () => ({ message: "Please select a resource type"}) }),
});

type ResourceFormInputs = z.infer<typeof resourceSchema>;

export function ManageResourcesClient() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryTab[]>([]);
  const [resources, setResources] = useState<Record<string, ResourceLink[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoryLoading, setIsCategoryLoading] = useState(true);

  useEffect(() => {
    setCategories(getCategories());
    setResources(getResourcesData());
    setIsCategoryLoading(false);
  }, []);

  const form = useForm<ResourceFormInputs>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      categoryId: "",
      title: "",
      url: "",
      description: "",
      type: undefined,
    },
  });

  const handleCategoryAdded = (newCategory: CategoryTab) => {
    addCategoryToMemory({ id: newCategory.id, label: newCategory.label, iconName: 'PlusCircle' }); // Assume default icon
    setCategories(getCategories());
    setResources(getResourcesData());
    toast({ title: "Category Added", description: `"${newCategory.label}" is now available for adding resources.` });
  };

  const onResourceSubmit: SubmitHandler<ResourceFormInputs> = async (data) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API

    const newResource: ResourceLink = {
      id: `${data.categoryId}-${data.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`, // Simple unique ID
      title: data.title,
      url: data.url,
      description: data.description,
      type: data.type,
    };
    
    const success = addResourceLinkToMemory(data.categoryId, newResource);

    if (success) {
      setResources(getResourcesData());
      toast({ title: "Resource Added", description: `"${data.title}" added to category "${categories.find(c=>c.id === data.categoryId)?.label}".` });
      form.reset({ categoryId: data.categoryId, title: "", url: "", description: "", type: undefined });
    } else {
      toast({ title: "Error", description: "Failed to add resource. Category might not exist.", variant: "destructive" });
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl lg:text-2xl flex items-center"><PlusCircle className="mr-2 h-5 w-5 md:h-6 md:w-6 text-primary" /> Add New Resource Category</CardTitle>
          <CardDescription className="text-xs md:text-sm">Create a new category (tab) for organizing resources.</CardDescription>
        </CardHeader>
        <CardContent>
          <AddCategoryForm onCategoryAdded={handleCategoryAdded} existingCategories={categories} />
        </CardContent>
      </Card>

      <Separator />

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl lg:text-2xl flex items-center"><BookOpenIcon className="mr-2 h-5 w-5 md:h-6 md:w-6 text-primary" /> Add New Resource Link</CardTitle>
          <CardDescription className="text-xs md:text-sm">Select a category and add a new resource link.</CardDescription>
        </CardHeader>
        <CardContent>
           {isCategoryLoading ? (
            <div className="flex items-center justify-center p-6 md:p-8">
              <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
              <p className="ml-2 text-sm md:text-base">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
             <p className="text-sm text-muted-foreground">No categories available. Please add a category first.</p>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onResourceSubmit)} className="space-y-4 md:space-y-6">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resource Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., MDN Web Docs for HTML" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://developer.mozilla.org/" {...field} />
                      </FormControl>
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
                        <Textarea placeholder="A short description of the resource." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resource Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select resource type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {resourceLinkTypes.map(type => (
                            <SelectItem key={type} value={type} className="capitalize">
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                  Add Resource
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <Separator />

      <Card className="shadow-md">
        <CardHeader>
            <CardTitle className="text-lg md:text-xl lg:text-2xl">Current Resources</CardTitle>
            <CardDescription className="text-xs md:text-sm">Overview of resources in each category.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 md:pt-6">
            {isCategoryLoading ? (
                <div className="flex items-center justify-center p-6 md:p-8">
                    <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
                    <p className="ml-2 text-sm md:text-base">Loading resources...</p>
                </div>
            ) : categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">No categories available to display resources.</p>
            ) : (
                <div className="space-y-4">
                    {categories.map(category => (
                        <div key={category.id}>
                            <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2 flex items-center">
                              {category.icon && <category.icon className="h-4 w-4 mr-2 text-primary/80" />}
                              {category.label} ({resources[category.id]?.length || 0} resources)
                            </h3>
                            {resources[category.id] && resources[category.id].length > 0 ? (
                                <ul className="space-y-1.5 text-xs md:text-sm text-muted-foreground pl-2">
                                    {resources[category.id].map(resource => (
                                        <li key={resource.id} className="flex items-start p-1.5 rounded-md hover:bg-muted/50">
                                            <LinkIcon className="h-3.5 w-3.5 mr-2 mt-0.5 shrink-0 text-primary/70" />
                                            <span className="truncate flex-grow" title={`${resource.title} (${resource.type})`}>
                                                {resource.title} <span className="text-muted-foreground/80">({resource.type})</span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs md:text-sm text-muted-foreground pl-2">No resources in this category yet.</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
