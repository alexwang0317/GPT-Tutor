export default function Home() {
  return (
    <div className="container mx-auto">
      {/* @ts-expect-error Async Server Component */}
      <PDFViewer />
    </div>
  );
}