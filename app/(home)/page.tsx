export default function HomePage(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="container-wide flex flex-1 flex-col items-center justify-center py-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-secondary-900 sm:text-6xl">
          FlowConvert
        </h1>
        <p className="mb-2 text-xl text-primary-600 sm:text-2xl">
          Drop. Done.
        </p>
        <p className="mb-8 text-lg text-secondary-600">
          Privacy First. Quality Always.
        </p>

        <p className="mb-12 max-w-2xl text-balance text-lg text-secondary-700">
          Convert, compress, resize, and edit files instantly in your browser.
          All processing happens on your device - your files never leave your
          computer.
        </p>

        {/* File Upload Zone */}
        <div className="w-full max-w-3xl">
          <div className="upload-zone">
            <svg
              className="mb-4 h-16 w-16 text-secondary-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <div className="mb-4">
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-primary-600 hover:text-primary-500"
              >
                <span className="text-lg font-semibold">
                  Click to upload
                </span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  multiple
                  disabled
                />
              </label>
              <p className="mt-1 text-secondary-600">or drag and drop</p>
            </div>

            <p className="text-sm text-secondary-500">
              Images, PDFs, Documents up to 50MB
            </p>

            {/* Privacy Badge */}
            <div className="mt-4 flex items-center gap-2">
              <svg
                className="h-5 w-5 text-client-side"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span className="text-sm font-medium text-client-side">
                100% Client-Side Processing
              </span>
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-secondary-600">
            Your files are processed entirely in your browser. We never upload
            or store your data.
          </p>
        </div>

        {/* Quick Features */}
        <div className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="text-center">
            <div className="mb-2 text-3xl">🖼️</div>
            <h3 className="mb-1 font-semibold text-secondary-900">
              Image Editing
            </h3>
            <p className="text-sm text-secondary-600">
              Resize, compress, crop, rotate
            </p>
          </div>

          <div className="text-center">
            <div className="mb-2 text-3xl">📄</div>
            <h3 className="mb-1 font-semibold text-secondary-900">
              PDF Tools
            </h3>
            <p className="text-sm text-secondary-600">
              Merge, split, extract pages
            </p>
          </div>

          <div className="text-center">
            <div className="mb-2 text-3xl">🇮🇳</div>
            <h3 className="mb-1 font-semibold text-secondary-900">
              Gov Docs
            </h3>
            <p className="text-sm text-secondary-600">
              Auto-format for DL, Passport, Aadhar
            </p>
          </div>

          <div className="text-center">
            <div className="mb-2 text-3xl">⚡</div>
            <h3 className="mb-1 font-semibold text-secondary-900">
              Batch Process
            </h3>
            <p className="text-sm text-secondary-600">
              Edit multiple files at once
            </p>
          </div>
        </div>

        {/* Temporary notice */}
        <div className="mt-12 rounded-lg border border-warning-200 bg-warning-50 p-4 text-sm text-warning-700">
          <p className="font-semibold">🚧 Under Development</p>
          <p className="mt-1">
            FlowConvert is currently being built. File upload functionality
            coming soon!
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-secondary-200 bg-white py-8">
        <div className="container-wide text-center text-sm text-secondary-600">
          <p>© 2025 FlowConvert. Privacy First. Quality Always.</p>
        </div>
      </footer>
    </div>
  );
}
