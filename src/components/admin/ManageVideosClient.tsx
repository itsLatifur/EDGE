// src/components/admin/ManageVideosClient.tsx
"use client";

import { useState, useEffect } from 'react';
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
import { PlusCircle, Video as VideoIconLucide, Loader2, Youtube } from 'lucide-react'; // Changed VideoIcon to VideoIconLucide to avoid conflict
import type { CategoryTab, VideoItem, PlaylistData } from '@/lib/constants';
import { addCategory as addCategoryToMemory, addVideoToPlaylist as addVideoToMemoryPlaylist, getCategories, getPlaylistData } from '@/lib/constants';
import { AddCategoryForm } from './AddCategoryForm';

const videoSchema = z.object({
  categoryId: z.string().min(1, { message: "Please select a category" }),
  videoId: z.string().min(5, { message: "YouTube Video ID is required" }), // Basic validation
  title: z.string().min(3, { message: "Video title is required" }),
  thumbnailUrl: z.string().url({ message: "Invalid thumbnail URL (optional, can be auto-generated or placeholder)" }).optional().or(z.literal('')),
});

type VideoFormInputs = z.infer<typeof videoSchema>;

export function ManageVideosClient() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryTab[]>([]);
  const [playlists, setPlaylists] = useState<Record<string, PlaylistData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoryLoading, setIsCategoryLoading] = useState(true);


  useEffect(() => {
    setCategories(getCategories());
    setPlaylists(getPlaylistData());
    setIsCategoryLoading(false);
  }, []);

  const form = useForm<VideoFormInputs>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      categoryId: "",
      videoId: "",
      title: "",
      thumbnailUrl: "",
    },
  });

  const handleCategoryAdded = (newCategory: CategoryTab) => {
    addCategoryToMemory({ id: newCategory.id, label: newCategory.label, iconName: 'PlusCircle' }); // Assuming default icon
    
    setCategories(getCategories()); 
    setPlaylists(getPlaylistData());

    toast({ title: "Category Added", description: `"${newCategory.label}" is now available for adding videos.` });
  };

  const onVideoSubmit: SubmitHandler<VideoFormInputs> = async (data) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const newVideo: VideoItem = {
      id: data.videoId,
      title: data.title,
      thumbnailUrl: data.thumbnailUrl || `https://i.ytimg.com/vi/${data.videoId}/hqdefault.jpg`, // Default YT thumbnail
    };
    
    const success = addVideoToMemoryPlaylist(data.categoryId, newVideo);

    if (success) {
      setPlaylists(getPlaylistData()); 
      toast({ title: "Video Added", description: `"${data.title}" added to category "${categories.find(c=>c.id === data.categoryId)?.label}".` });
      form.reset({ categoryId: data.categoryId, videoId: "", title: "", thumbnailUrl: "" }); 
    } else {
      toast({ title: "Error", description: "Failed to add video. Category might not exist.", variant: "destructive" });
    }
    setIsLoading(false);
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onVideoSubmit)} className="space-y-4 md:space-y-6">
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
                  name="videoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YouTube Video ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., qz0aGYrrlhU" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., HTML Crash Course" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="thumbnailUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thumbnail URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                  Add Video
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <Separator />
      
      <Card className="shadow-md">
        <CardHeader>
            <CardTitle className="text-lg md:text-xl lg:text-2xl">Current Video Playlists</CardTitle>
            <CardDescription className="text-xs md:text-sm">Overview of videos in each category.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 md:pt-6">
            {isCategoryLoading ? (
                 <div className="flex items-center justify-center p-6 md:p-8">
                    <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
                    <p className="ml-2 text-sm md:text-base">Loading playlists...</p>
                </div>
            ) : categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">No categories available to display playlists.</p>
            ) : (
                <div className="space-y-4">
                    {categories.map(category => (
                        <div key={category.id}>
                             <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2 flex items-center">
                              {category.icon && <category.icon className="h-4 w-4 mr-2 text-primary/80" />}
                              {category.label} ({playlists[category.id]?.videos?.length || 0} videos)
                            </h3>
                            {playlists[category.id]?.videos && playlists[category.id].videos.length > 0 ? (
                                <ul className="space-y-1.5 text-xs md:text-sm text-muted-foreground pl-2">
                                    {playlists[category.id].videos.map(video => (
                                        <li key={video.id} className="flex items-start p-1.5 rounded-md hover:bg-muted/50">
                                            <Youtube className="h-3.5 w-3.5 mr-2 mt-0.5 shrink-0 text-red-500/90" />
                                            <span className="truncate flex-grow" title={`${video.title} (ID: ${video.id})`}>
                                                {video.title} <span className="text-muted-foreground/80">(ID: {video.id})</span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs md:text-sm text-muted-foreground pl-2">No videos in this playlist yet.</p>
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
