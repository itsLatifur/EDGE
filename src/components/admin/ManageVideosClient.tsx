// src/components/admin/ManageVideosClient.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Video as VideoIconLucide, Loader2, Youtube, Trash2, Edit3, AlertTriangle } from 'lucide-react';
import type { CategoryTab, VideoItem, PlaylistData } from '@/lib/constants';
import { 
  addCategory as addCategoryInMemory, 
  addVideoToPlaylist as addVideoToMemoryPlaylist, 
  getCategories, 
  getPlaylistData,
  updateCategory as updateCategoryInMemory,
  deleteCategory as deleteCategoryInMemory,
  updateVideoInPlaylist as updateVideoInMemory,
  deleteVideoFromPlaylist as deleteVideoInMemory,
  LUCIDE_ICON_MAP,
  AVAILABLE_ICONS_FOR_TABS
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
import Image from 'next/image';


const videoSchema = z.object({
  categoryId: z.string().min(1, { message: "Please select a category" }),
  videoId: z.string().min(5, { message: "YouTube Video ID is required (e.g., qz0aGYrrlhU)" }).regex(/^[a-zA-Z0-9_-]{11}$/, { message: "Invalid YouTube Video ID format" }),
  title: z.string().min(3, { message: "Video title is required" }),
  thumbnailUrl: z.string().url({ message: "Invalid thumbnail URL (optional, can be auto-generated or placeholder)" }).optional().or(z.literal('')),
});

type VideoFormInputs = z.infer<typeof videoSchema>;

type LastAction = 
  | { type: 'add-category', data: CategoryTab }
  | { type: 'update-category', oldData: CategoryTab, newData: CategoryTab }
  | { type: 'delete-category', data: CategoryTab & { associatedVideos: VideoItem[] } }
  | { type: 'add-video', data: VideoItem, categoryId: string }
  | { type: 'update-video', oldData: VideoItem, newData: VideoItem, categoryId: string }
  | { type: 'delete-video', data: VideoItem, categoryId: string };

export function ManageVideosClient() {
  const { toast, dismiss } = useToast();
  const [categories, setCategories] = useState<CategoryTab[]>([]);
  const [playlists, setPlaylists] = useState<Record<string, PlaylistData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoryLoading, setIsCategoryLoading] = useState(true);

  const [editingCategory, setEditingCategory] = useState<CategoryTab | null>(null);
  const [editingVideo, setEditingVideo] = useState<{ video: VideoItem, categoryId: string } | null>(null);
  const [lastAction, setLastAction] = useState<LastAction | null>(null);
  const [lastToastId, setLastToastId] = useState<string | null>(null);

  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
  const [isEditVideoDialogOpen, setIsEditVideoDialogOpen] = useState(false);

  const categoryEditForm = useForm<CategoryFormInputs>({ 
    resolver: zodResolver(categoryFormSchema), 
  });

  const videoEditForm = useForm<VideoFormInputs>({
    resolver: zodResolver(videoSchema),
  });

  const refreshData = useCallback(() => {
    setIsCategoryLoading(true);
    setCategories(getCategories());
    setPlaylists(getPlaylistData());
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
      lastAction.data.associatedVideos.forEach(vid => addVideoToMemoryPlaylist(lastAction.data.id, vid));
    } else if (lastAction.type === 'update-category') {
      updateCategoryInMemory(lastAction.oldData.id, lastAction.oldData);
    } else if (lastAction.type === 'add-video') {
      deleteVideoInMemory(lastAction.categoryId, lastAction.data.id);
    } else if (lastAction.type === 'delete-video') {
      addVideoToMemoryPlaylist(lastAction.categoryId, lastAction.data);
    } else if (lastAction.type === 'update-video') {
      updateVideoInMemory(lastAction.categoryId, lastAction.oldData.id, lastAction.oldData);
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
    const videosInCategory = playlists[categoryId]?.videos || [];
    if (categoryToDelete) {
      deleteCategoryInMemory(categoryId);
      setLastAction({ type: 'delete-category', data: { ...categoryToDelete, associatedVideos: videosInCategory } });
      refreshData();
      showUndoToast("Category Deleted", `"${categoryToDelete.label}" and its videos deleted.`, handleUndo);
    }
  };

  const videoAddForm = useForm<VideoFormInputs>({
    resolver: zodResolver(videoSchema),
    defaultValues: { categoryId: "", videoId: "", title: "", thumbnailUrl: "" },
  });

  const onVideoSubmit: SubmitHandler<VideoFormInputs> = async (data) => {
    setIsLoading(true);
    const newVideo: VideoItem = {
      id: data.videoId,
      title: data.title,
      thumbnailUrl: data.thumbnailUrl || `https://i.ytimg.com/vi/${data.videoId}/hqdefault.jpg`,
    };
    
    const addedVideo = addVideoToMemoryPlaylist(data.categoryId, newVideo);
    setIsLoading(false);
    if (addedVideo) {
      setLastAction({ type: 'add-video', data: addedVideo, categoryId: data.categoryId });
      refreshData();
      showUndoToast("Video Added", `"${addedVideo.title}" added.`, handleUndo);
      videoAddForm.reset({ categoryId: data.categoryId, videoId: "", title: "", thumbnailUrl: "" }); 
    } else {
      toast({ title: "Error", description: "Failed to add video. Category might not exist or video ID conflicts.", variant: "destructive" });
    }
  };

  const handleVideoUpdate = async (data: VideoFormInputs) => {
    if (!editingVideo) return;
    setIsLoading(true);
    const oldVideo = playlists[editingVideo.categoryId]?.videos.find(v => v.id === editingVideo.video.id);
    const videoDataToUpdate: Partial<Omit<VideoItem, 'id'>> = {
        title: data.title,
        thumbnailUrl: data.thumbnailUrl || `https://i.ytimg.com/vi/${data.videoId}/hqdefault.jpg`,
    };
    const updatedVideo = updateVideoInMemory(editingVideo.categoryId, editingVideo.video.id, videoDataToUpdate);
    setIsLoading(false);
    if (updatedVideo && oldVideo) {
      setLastAction({ type: 'update-video', oldData: oldVideo, newData: updatedVideo, categoryId: editingVideo.categoryId });
      refreshData();
      setEditingVideo(null);
      setIsEditVideoDialogOpen(false);
      showUndoToast("Video Updated", `"${updatedVideo.title}" updated.`, handleUndo);
      videoEditForm.reset();
    } else {
      toast({ title: "Error", description: "Failed to update video.", variant: "destructive" });
    }
  };

  const openEditVideoDialog = (video: VideoItem, categoryId: string) => {
    setEditingVideo({ video, categoryId });
    videoEditForm.reset({
      categoryId: categoryId,
      videoId: video.id, 
      title: video.title,
      thumbnailUrl: video.thumbnailUrl,
    });
    setIsEditVideoDialogOpen(true);
  };

  const handleDeleteVideo = (categoryId: string, videoId: string) => {
    const videoToDelete = playlists[categoryId]?.videos.find(v => v.id === videoId);
    if (videoToDelete) {
      deleteVideoInMemory(categoryId, videoId);
      setLastAction({ type: 'delete-video', data: videoToDelete, categoryId: categoryId });
      refreshData();
      showUndoToast("Video Deleted", `"${videoToDelete.title}" deleted.`, handleUndo);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl lg:text-2xl flex items-center"><PlusCircle className="mr-2 h-5 w-5 md:h-6 md:w-6 text-primary" /> Add New Video Category</CardTitle>
          <CardDescription className="text-xs md:text-sm">Create a new category (tab) for organizing videos.</CardDescription>
        </CardHeader>
        <CardContent>
          <AddCategoryForm onCategoryAdded={handleCategoryAdded} existingCategories={categories} />
        </CardContent>
      </Card>

      <Separator />

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl lg:text-2xl flex items-center"><VideoIconLucide className="mr-2 h-5 w-5 md:h-6 md:w-6 text-primary" /> Add Video to Playlist</CardTitle>
          <CardDescription className="text-xs md:text-sm">Select a category and add a new video.</CardDescription>
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
            <Form {...videoAddForm}>
              <form onSubmit={videoAddForm.handleSubmit(onVideoSubmit)} className="space-y-4 md:space-y-6">
                <FormField control={videoAddForm.control} name="categoryId" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl><SelectContent>{categories.map(category => (<SelectItem key={category.id} value={category.id}>{category.label}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={videoAddForm.control} name="videoId" render={({ field }) => (<FormItem><FormLabel>YouTube Video ID</FormLabel><FormControl><Input placeholder="e.g., qz0aGYrrlhU" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={videoAddForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Video Title</FormLabel><FormControl><Input placeholder="e.g., HTML Crash Course" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={videoAddForm.control} name="thumbnailUrl" render={({ field }) => (<FormItem><FormLabel>Thumbnail URL (Optional)</FormLabel><FormControl><Input placeholder="Auto from ID, or https://example.com/image.jpg" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}Add Video</Button>
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
        <DialogContent className="sm:max-w-md" id="edit-video-category-dialog">
          <DialogHeader><DialogTitle>Edit Video Category</DialogTitle></DialogHeader>
          {editingCategory && (
            <Form {...categoryEditForm}>
              <form onSubmit={categoryEditForm.handleSubmit(handleCategoryUpdate)} className="space-y-4 pt-2">
                <input type="hidden" {...categoryEditForm.register("id")} />
                <FormField control={categoryEditForm.control} name="label" render={({ field }) => (<FormItem><FormLabel>Label</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={categoryEditForm.control} name="iconName" render={({ field }) => (<FormItem><FormLabel>Icon</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{AVAILABLE_ICONS_FOR_TABS.map(iconNameKey => { const IconC = LUCIDE_ICON_MAP[iconNameKey]; return (<SelectItem key={iconNameKey} value={iconNameKey}><div className="flex items-center"><IconC className="mr-2 h-4 w-4" />{iconNameKey}</div></SelectItem>);})}</SelectContent></Select><FormMessage /></FormItem>)} />
                <div className="flex justify-end space-x-2">
                  <DialogClose asChild><Button type="button" variant="outline" id="edit-video-category-dialog-close">Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" /> : "Save"}</Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Video Dialog */}
      <Dialog open={isEditVideoDialogOpen} onOpenChange={(open) => {
        setIsEditVideoDialogOpen(open);
        if (!open) setEditingVideo(null);
      }}>
        <DialogContent className="sm:max-w-lg" id="edit-video-dialog">
          <DialogHeader><DialogTitle>Edit Video Details</DialogTitle></DialogHeader>
          {editingVideo && (
            <Form {...videoEditForm}>
              <form onSubmit={videoEditForm.handleSubmit(handleVideoUpdate)} className="space-y-4 pt-2">
                <input type="hidden" {...videoEditForm.register("categoryId")} />
                <FormField control={videoEditForm.control} name="videoId" render={({ field }) => (<FormItem><FormLabel>YouTube Video ID (Cannot be changed)</FormLabel><FormControl><Input {...field} readOnly className="bg-muted/50" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={videoEditForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={videoEditForm.control} name="thumbnailUrl" render={({ field }) => (<FormItem><FormLabel>Thumbnail URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="flex justify-end space-x-2">
                  <DialogClose asChild><Button type="button" variant="outline" id="edit-video-dialog-close">Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" /> : "Save Changes"}</Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
      
      <Card className="shadow-md">
        <CardHeader>
            <CardTitle className="text-lg md:text-xl lg:text-2xl">Current Video Playlists</CardTitle>
            <CardDescription className="text-xs md:text-sm">Overview of videos in each category. Click to edit or delete.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 md:pt-6">
            {isCategoryLoading ? (
                 <div className="flex items-center justify-center p-6 md:p-8"> <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" /> <p className="ml-2 text-sm md:text-base">Loading playlists...</p></div>
            ) : categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">No categories available to display playlists.</p>
            ) : (
                <div className="space-y-4">
                    {categories.map(category => {
                        const IconComponent = LUCIDE_ICON_MAP[category.iconName];
                        return (
                        <div key={category.id} className="p-3 border rounded-lg shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-base md:text-lg font-semibold flex items-center">
                                  {IconComponent && <IconComponent className="h-4 w-4 mr-2 text-primary/80" />}
                                  {category.label} ({playlists[category.id]?.videos?.length || 0} videos)
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
                                            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will delete the category "{category.label}" and all its associated videos. This action cannot be easily undone.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteCategory(category.id)}>Confirm Delete</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                            {playlists[category.id]?.videos && playlists[category.id].videos.length > 0 ? (
                                <ul className="space-y-1.5 text-xs md:text-sm text-muted-foreground pl-2">
                                    {playlists[category.id].videos.map(video => (
                                        <li key={video.id} className="flex items-center justify-between p-1.5 rounded-md hover:bg-muted/50 group">
                                            <div className="flex items-start flex-grow min-w-0">
                                                <div className="relative w-16 h-9 mr-2 shrink-0 rounded overflow-hidden">
                                                   <Image src={video.thumbnailUrl || `https://i.ytimg.com/vi/${video.id}/default.jpg`} alt={video.title} fill sizes="64px" className="object-cover" data-ai-hint="video thumbnail" />
                                                </div>
                                                <span className="truncate flex-grow" title={`${video.title} (ID: ${video.id})`}>
                                                    {video.title} <span className="text-muted-foreground/80">(ID: {video.id})</span>
                                                </span>
                                            </div>
                                            <div className="space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditVideoDialog(video, category.id)}>
                                                    <Edit3 className="h-3.5 w-3.5" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive">
                                                          <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>Delete Video?</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete the video "{video.title}"?</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteVideo(category.id, video.id)}>Confirm Delete</AlertDialogAction></AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs md:text-sm text-muted-foreground pl-2 italic">No videos in this playlist yet.</p>
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