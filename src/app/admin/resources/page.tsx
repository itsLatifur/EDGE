// src/app/admin/resources/page.tsx
import { ManageResourcesClient } from '@/components/admin/ManageResourcesClient';

export default function ManageResourcesPage() {
  return (
    <div>
      <header className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Manage Resources</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Add new resource categories and curate links for each.
        </p>
      </header>
      <ManageResourcesClient />
    </div>
  );
}
