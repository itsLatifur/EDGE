// src/app/admin/videos/page.tsx
import { ManageVideosClient } from '@/components/admin/ManageVideosClient';

export default function ManageVideosPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Manage Videos</h1>
        <p className="text-muted-foreground">
          Add new video categories and populate them with YouTube videos.
        </p>
      </header>
      <ManageVideosClient />
    </div>
  );
}
