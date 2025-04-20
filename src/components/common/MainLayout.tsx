import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: LayoutProps) => (
    <div className="min-h-screen bg-dark-bg text-white relative">
      <main className="relative">{children}</main>
    </div>
  );

export default MainLayout;
