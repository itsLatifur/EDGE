export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t py-6 mt-12 bg-secondary">
      <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
        © {currentYear} Self-Learn. All rights reserved.
      </div>
    </footer>
  );
}
