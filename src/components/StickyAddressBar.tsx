import React from 'react';

export default function StickyAddressBar({ address }: { address: string }) {
  return (
    <div className="sticky top-16 z-40 bg-white border-b border-gray-200 px-4 py-1">
      <span className="text-base font-medium whitespace-normal break-words">{address}</span>
    </div>
  );
} 