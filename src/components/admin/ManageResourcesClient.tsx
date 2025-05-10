// src/components/admin/ManageResourcesClient.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
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
import { PlusCircle, BookOpen as BookOpenIcon, Loader2, Link as LinkIcon, Trash2, Edit3, AlertTriangle } from 'lucide-react';
import type { CategoryTab, ResourceLink, ResourceType } from '@/lib/constants';
import { 
  addCategory as addCategoryInMemory, 
  addResourceLink as addResourceLinkInMemory, 
  getCategories, 
  getResourcesData,
  updateCategory as updateCategoryInMemory,
  deleteCategory as deleteCategoryInMemory,
  updateResourceLink as updateResourceLinkInMemory,
  deleteResourceLink as deleteResourceLinkInMemory,
  LUCIDE_ICON_MAP,
  AVAILABLE_ICONS_FOR_TABS,
  RESOURCE_LINK_TYPES
} from '@/lib/constants';
import { AddCategoryForm, categoryFormSchema, type CategoryFormInputs } from './AddCategoryForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { ToastAction } from '@/components/ui/toast';


const resourceSchema = z.object({
  categoryId: z.string().min(1, { message: "Please select a category" }),
  title: z.string().min(3, { message: "Resource title is required" }),
  url: z.string().url({ message: "A valid URL is required" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  type: z.enum(RESOURCE_LINK_TYPES, { errorMap: () => ({ message: "Please select a resource type"}) }),
});

type ResourceFormInputs = z.infer<typeof resourceSchema>;

type LastAction = 
  | { type: 'add-category', data: CategoryTab }
  | { type: 'update-category', oldData: CategoryTab, newData: CategoryTab }
  | { type: 'delete-category', data: CategoryTab & { associatedResources: ResourceLink[] } } 
  | { type: 'add-resource', data: ResourceLink, categoryId: string }
  | { type: 'update-resource', oldData: ResourceLink, newData: ResourceLink, categoryId: string }
  | { type: 'delete-resource', data: ResourceLink, categoryId: string };


export function ManageResourcesClient() {
  const { toast, dismiss } = useToast();
  const [categories, setCategories] = useState<CategoryTab[]>([]);
  const [resources, setResources] = useState<Record<string, ResourceLink[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoryLoading, setIsCategoryLoading] = useState(true);

  const [editingCategory, setEditingCategory] = useState<CategoryTab | null>(null);
  const [editingResource, setEditingResource] = useState<{ resource: ResourceLink, categoryId: string } | null>(null);
  const [lastAction, setLastAction] = useState<LastAction | null>(null);
  const [lastToastId, setLastToastId] = useState<string | null>(null);

  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
  const [isEditResourceDialogOpen, setIsEditResourceDialogOpen] = useState(false);


  const categoryEditForm = useForm<CategoryFormInputs>({ 
    resolver: zodResolver(categoryFormSchema), 
  });

  const resourceEditForm = useForm<ResourceFormInputs>({
    resolver: zodResolver(resourceSchema),
  });

  const refreshData = useCallback(() => {
    setIsCategoryLoading(true);
    setCategories(getCategories());
    setResources(getResourcesData());
    setIsCategoryLoading(false);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const showUndoToast = (title: string, description: string, undoAction: () => void) => {
    if (lastToastId) {
      dismiss(lastToastId); 
    }
    const newToast = toast({
      title,
      description,
      duration: 7000,
      action: <ToastAction altText="Undo" onClick={() => {
        undoAction();
        dismiss(newToast.id);
        setLastAction(null);
        setLastToastId(null);
      }}>Undo</ToastAction>,
    });
    setLastToastId(newToast.id);
  };

  const handleUndo = () => {
    if (!lastAction) return;

    if (lastAction.type === 'add-category') {
      deleteCategoryInMemory(lastAction.data.id);
    } else if (lastAction.type === 'delete-category') {
      addCategoryInMemory(lastAction.data);
      lastAction.data.associatedResources.forEach(res => addResourceLinkInMemory(lastAction.data.id, res));
    } else if (lastAction.type === 'update-category') {
      updateCategoryInMemory(lastAction.oldData.id, lastAction.oldData);
    } else if (lastAction.type === 'add-resource') {
      deleteResourceLinkInMemory(lastAction.categoryId, lastAction.data.id);
    } else if (lastAction.type === 'delete-resource') {
      addResourceLinkInMemory(lastAction.categoryId, lastAction.data);
    } else if (lastAction.type === 'update-resource') {
      updateResourceLinkInMemory(lastAction.categoryId, lastAction.oldData.id, lastAction.oldData);
    }
    refreshData();
    toast({ title: "Action Undone", description: "The previous action has been reverted." });
    setLastAction(null);
  };


  const handleCategoryAdded = (newCategoryData: { id: string; label: string; iconName: keyof typeof LUCIDE_ICON_MAP }) => {
    const addedCategory = addCategoryInMemory(newCategoryData);
    if (addedCategory) {
      setLastAction({ type: 'add-category', data: addedCategory });
      refreshData();
      showUndoToast("Category Added", `"${addedCategory.label}" created.`, handleUndo);
    } else {
      toast({ title: "Error", description: "Failed to add category. It might already exist.", variant: "destructive" });
    }
  };

  const handleCategoryUpdate = async (data: CategoryFormInputs) => {
    if (!editingCategory) return;
    setIsLoading(true);
    const oldCategory = categories.find(c => c.id === editingCategory.id);
    const updatedCategory = updateCategoryInMemory(editingCategory.id, data);
    setIsLoading(false);
    if (updatedCategory && oldCategory) {
      setLastAction({ type: 'update-category', oldData: oldCategory, newData: updatedCategory });
      refreshData();
      setEditingCategory(null);
      setIsEditCategoryDialogOpen(false);
      showUndoToast("Category Updated", `"${updatedCategory.label}" updated.`, handleUndo);
      categoryEditForm.reset();
    } else {
      toast({ title: "Error", description: "Failed to update category. Label might conflict.", variant: "destructive" });
    }
  };
  
  const openEditCategoryDialog = (category: CategoryTab) => {
    setEditingCategory(category);
    categoryEditForm.reset({ id: category.id, label: category.label, iconName: category.iconName });
    setIsEditCategoryDialogOpen(true);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const categoryToDelete = categories.find(c => c.id === categoryId);
    const resourcesInCategory = resources[categoryId] || [];
    if (categoryToDelete) {
      deleteCategoryInMemory(categoryId);
      setLastAction({ type: 'delete-category', data: { ...categoryToDelete, associatedResources: resourcesInCategory } });
      refreshData();
      showUndoToast("Category Deleted", `"${categoryToDelete.label}" and its resources deleted.`, handleUndo);
    }
  };

  const resourceAddForm = useForm<ResourceFormInputs>({
    resolver: zodResolver(resourceSchema),
    defaultValues: { categoryId: "", title: "", url: "", description: "", type: undefined },
  });

  const onResourceSubmit: SubmitHandler<ResourceFormInputs> = async (data) => {
    setIsLoading(true);
    const newResourceData: Omit<ResourceLink, 'id'> = {
      title: data.title,
      url: data.url,
      description: data.description,
      type: data.type,
    };
    const newResource: ResourceLink = {
      ...newResourceData,
      id: `${data.categoryId}-${data.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    };
    
    const addedResource = addResourceLinkInMemory(data.categoryId, newResource);
    setIsLoading(false);
    if (addedResource) {
      setLastAction({ type: 'add-resource', data: addedResource, categoryId: data.categoryId });
      refreshData();
      showUndoToast("Resource Added", `"${addedResource.title}" added.`, handleUndo);
      resourceAddForm.reset({ categoryId: data.categoryId, title: "", url: "", description: "", type: undefined });
    } else {
      toast({ title: "Error", description: "Failed to add resource. Category might not exist or resource URL/ID conflicts.", variant: "destructive" });
    }
  };

  const handleResourceUpdate = async (data: ResourceFormInputs) => {
    if (!editingResource) return;
    setIsLoading(true);
    const oldResource = resources[editingResource.categoryId]?.find(r => r.id === editingResource.resource.id);
    const updatedResource = updateResourceLinkInMemory(editingResource.categoryId, editingResource.resource.id, data);
    setIsLoading(false);
    if (updatedResource && oldResource) {
      setLastAction({ type: 'update-resource', oldData: oldResource, newData: updatedResource, categoryId: editingResource.categoryId });
      refreshData();
      setEditingResource(null);
      setIsEditResourceDialogOpen(false);
      showUndoToast("Resource Updated", `"${updatedResource.title}" updated.`, handleUndo);
      resourceEditForm.reset();
    } else {
      toast({ title: "Error", description: "Failed to update resource. URL might conflict.", variant: "destructive" });
    }
  };

  const openEditResourceDialog = (resource: ResourceLink, categoryId: string) => {
    setEditingResource({ resource, categoryId });
    resourceEditForm.reset({
      categoryId: categoryId,
      title: resource.title,
      url: resource.url,
      description: resource.description,
      type: resource.type,
    });
    setIsEditResourceDialogOpen(true);
  };

  const handleDeleteResource = (categoryId: string, resourceId: string) => {
    const resourceToDelete = resources[categoryId]?.find(r => r.id === resourceId);
    if (resourceToDelete) {
      deleteResourceLinkInMemory(categoryId, resourceId);
      setLastAction({ type: 'delete-resource', data: resourceToDelete, categoryId: categoryId });
      refreshData();
      showUndoToast("Resource Deleted", `"${resourceToDelete.title}" deleted.`, handleUndo);
    }
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
            <Form {...resourceAddForm}>
              <form onSubmit={resourceAddForm.handleSubmit(onResourceSubmit)} className="space-y-4 md:space-y-6">
                <FormField
                  control={resourceAddForm.control}
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
                  control={resourceAddForm.control}
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
                  control={resourceAddForm.control}
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
                  control={resourceAddForm.control}
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
                  control={resourceAddForm.control}
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
                          {RESOURCE_LINK_TYPES.map(type => (
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

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryDialogOpen} onOpenChange={(open) => {
        setIsEditCategoryDialogOpen(open);
        if (!open) setEditingCategory(null);
      }}>
        <DialogContent className="sm:max-w-md" id="edit-category-dialog">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <Form {...categoryEditForm}>
              <form onSubmit={categoryEditForm.handleSubmit(handleCategoryUpdate)} className="space-y-4 pt-2">
                <input type="hidden" {...categoryEditForm.register("id")} />
                <FormField
                  control={categoryEditForm.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Label</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={categoryEditForm.control}
                  name="iconName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {AVAILABLE_ICONS_FOR_TABS.map(iconNameKey => {
                            const IconC = LUCIDE_ICON_MAP[iconNameKey];
                            return (<SelectItem key={iconNameKey} value={iconNameKey}><div className="flex items-center"><IconC className="mr-2 h-4 w-4" />{iconNameKey}</div></SelectItem>);
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <DialogClose asChild><Button type="button" variant="outline" id="edit-category-dialog-close">Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" /> : "Save Changes"}</Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Resource Dialog */}
       <Dialog open={isEditResourceDialogOpen} onOpenChange={(open) => {
         setIsEditResourceDialogOpen(open);
         if (!open) setEditingResource(null);
       }}>
        <DialogContent className="sm:max-w-lg" id="edit-resource-dialog">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
          </DialogHeader>
          {editingResource && (
            <Form {...resourceEditForm}>
              <form onSubmit={resourceEditForm.handleSubmit(handleResourceUpdate)} className="space-y-4 pt-2">
                <input type="hidden" {...resourceEditForm.register("categoryId")} />
                <FormField control={resourceEditForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={resourceEditForm.control} name="url" render={({ field }) => (<FormItem><FormLabel>URL</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={resourceEditForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField
                  control={resourceEditForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resource Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {RESOURCE_LINK_TYPES.map(type => (<SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <DialogClose asChild><Button type="button" variant="outline" id="edit-resource-dialog-close">Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" /> : "Save Changes"}</Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>


      <Card className="shadow-md">
        <CardHeader>
            <CardTitle className="text-lg md:text-xl lg:text-2xl">Current Resources</CardTitle>
            <CardDescription className="text-xs md:text-sm">Overview of resources in each category. Click to edit or delete.</CardDescription>
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
                    {categories.map(category => {
                        const IconComponent = LUCIDE_ICON_MAP[category.iconName];
                        return (
                        <div key={category.id} className="p-3 border rounded-lg shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-base md:text-lg font-semibold flex items-center">
                                  {IconComponent && <IconComponent className="h-4 w-4 mr-2 text-primary/80" />}
                                  {category.label} ({resources[category.id]?.length || 0} resources)
                                </h3>
                                <div className="space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => openEditCategoryDialog(category)}>
                                        <Edit3 className="h-3.5 w-3.5" /> <span className="sr-only sm:not-sr-only sm:ml-1">Edit</span>
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm">
                                                <Trash2 className="h-3.5 w-3.5" /> <span className="sr-only sm:not-sr-only sm:ml-1">Delete</span>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will delete the category "{category.label}" and all its associated resources. This action cannot be easily undone.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteCategory(category.id)}>Confirm Delete</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                            {resources[category.id] && resources[category.id].length > 0 ? (
                                <ul className="space-y-1.5 text-xs md:text-sm text-muted-foreground pl-2">
                                    {resources[category.id].map(resource => (
                                        <li key={resource.id} className="flex items-center justify-between p-1.5 rounded-md hover:bg-muted/50 group">
                                            <div className="flex items-start flex-grow min-w-0">
                                                <LinkIcon className="h-3.5 w-3.5 mr-2 mt-0.5 shrink-0 text-primary/70" />
                                                <span className="truncate flex-grow" title={`${resource.title} (${resource.type}) - ${resource.url}`}>
                                                    {resource.title} <span className="text-muted-foreground/80">({resource.type})</span>
                                                </span>
                                            </div>
                                            <div className="space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditResourceDialog(resource, category.id)}>
                                                    <Edit3 className="h-3.5 w-3.5" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>Delete Resource?</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete the resource "{resource.title}"?</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteResource(category.id, resource.id)}>Confirm Delete</AlertDialogAction></AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs md:text-sm text-muted-foreground pl-2 italic">No resources in this category yet.</p>
                            )}
                        </div>
                    )})}
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}