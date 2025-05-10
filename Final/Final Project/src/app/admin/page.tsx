// src/app/admin/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Video, BookOpen } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6 md:space-y-8">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">Manage your platform's content from here.</p>
      </header>

      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2 md:gap-3">
              <Video className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              <CardTitle className="text-lg md:text-xl lg:text-2xl">Manage Videos</CardTitle>
            </div>
            <CardDescription className="text-xs md:text-sm">
              Add new video categories (tabs) and upload videos to existing or new playlists.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
              Organize educational video content for HTML, CSS, JavaScript, and more.
            </p>
            <Button asChild className="w-full sm:w-auto text-xs md:text-sm">
              <Link href="/admin/videos">Go to Video Management</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2 md:gap-3">
              <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              <CardTitle className="text-lg md:text-xl lg:text-2xl">Manage Resources</CardTitle>
            </div>
            <CardDescription className="text-xs md:text-sm">
              Curate resource categories (tabs) and add helpful links, articles, and tools.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
              Provide learners with valuable external resources for each topic.
            </p>
            <Button asChild className="w-full sm:w-auto text-xs md:text-sm">
              <Link href="/admin/resources">Go to Resource Management</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

       <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="text-lg md:text-xl">Quick Overview</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                Welcome to the Self-Learn Platform admin panel. Use the navigation on the left (or the menu button on mobile) to manage video playlists and curated resources.
                You can add new categories (which appear as tabs on the main site) and then populate these categories with relevant content.
            </p>
            <p className="mt-2 text-xs md:text-sm text-destructive">
                <strong>Note:</strong> For this demonstration, data changes (new categories, videos, resources) are managed in-memory and will reset on page refresh or server restart. A full database integration is required for persistent storage.
            </p>
        </CardContent>
       </Card>
    </div>
  );
}
