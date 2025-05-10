// src/app/admin/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Video, BookOpen } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your platform's content from here.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Video className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl">Manage Videos</CardTitle>
            </div>
            <CardDescription>
              Add new video categories (tabs) and upload videos to existing or new playlists.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Organize educational video content for HTML, CSS, JavaScript, and more.
            </p>
            <Button asChild>
              <Link href="/admin/videos">Go to Video Management</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl">Manage Resources</CardTitle>
            </div>
            <CardDescription>
              Curate resource categories (tabs) and add helpful links, articles, and tools.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Provide learners with valuable external resources for each topic.
            </p>
            <Button asChild>
              <Link href="/admin/resources">Go to Resource Management</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

       <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Quick Overview</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
                Welcome to the Self-Learn Platform admin panel. Use the navigation on the left to manage video playlists and curated resources.
                You can add new categories (which appear as tabs on the main site) and then populate these categories with relevant content.
            </p>
            <p className="mt-2 text-sm text-destructive">
                <strong>Note:</strong> For this demonstration, data changes (new categories, videos, resources) are managed in-memory and will reset on page refresh or server restart. A full database integration is required for persistent storage.
            </p>
        </CardContent>
       </Card>
    </div>
  );
}
