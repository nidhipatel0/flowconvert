export default function EditorPage(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-secondary-200 bg-white">
        <div className="container-wide py-4">
          <h1 className="text-2xl font-bold text-secondary-900">
            FlowConvert Editor
          </h1>
        </div>
      </header>

      <main className="flex-1 bg-secondary-50 p-8">
        <div className="container-wide">
          <div className="rounded-lg border border-warning-200 bg-warning-50 p-6">
            <h2 className="mb-2 text-lg font-semibold text-warning-900">
              🚧 Editor Under Construction
            </h2>
            <p className="text-warning-700">
              The file editor interface is currently being developed. This page
              will include:
            </p>
            <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-warning-700">
              <li>File upload and preview</li>
              <li>Editing toolbar with tools (resize, crop, compress, etc.)</li>
              <li>Real-time preview panel</li>
              <li>Operation history with undo/redo</li>
              <li>Download processed files</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
