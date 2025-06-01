export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60dvh] p-8 pb-20 gap-6 sm:p-20">
      <main className="flex flex-col gap-6 items-center text-center">
        <h1 className="text-4xl font-bold text-white">
          404 - Page Not Found
        </h1>
        <p className="text-lg text-white">
          Sorry, the page you are looking for does not exist.
        </p>
      </main>
    </div>
  );
}
