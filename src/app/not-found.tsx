import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-7xl font-bold text-text-tertiary">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-text-primary">
          Page not found
        </h2>
        <p className="mt-2 text-text-secondary">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
