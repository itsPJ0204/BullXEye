import React from 'react';

interface MobileWrapperProps {
  children: React.ReactNode;
}

export default function MobileWrapper({ children }: MobileWrapperProps) {
  return (
    <div className="flex justify-center min-h-screen bg-gray-200">
      <div className="w-full max-w-md h-screen overflow-y-auto bg-off-white shadow-2xl relative flex flex-col">
        {children}
      </div>
    </div>
  );
}
