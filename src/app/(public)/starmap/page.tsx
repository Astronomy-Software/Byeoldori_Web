"use client";

export default function StarMapPage() {
  return (
    <div className="relative h-screen w-full">
      <iframe
        src="/stellarium/index.html"
        className="h-full w-full border-0"
        allow="gyroscope; accelerometer"
        title="Stellarium 별지도"
      />
    </div>
  );
}
