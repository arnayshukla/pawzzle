import { Uploader } from "@/components/Uploader";
import { ImageGallery } from "@/components/ImageGallery";
import { LogOut } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-zinc-50 p-4 sm:p-8 font-sans dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Pawzzle Logo" className="w-10 h-10 rounded-xl hidden sm:block" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Admin Dashboard
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Upload and manage dog photos for the puzzle game.
              </p>
            </div>
          </div>
          <form action="/api/admin/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </header>

        <main className="space-y-8">
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-6 px-2">
              Upload Photos
            </h2>
            <Uploader />
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
            <ImageGallery />
          </section>
        </main>
      </div>
    </div>
  );
}
