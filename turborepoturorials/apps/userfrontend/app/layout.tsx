import type { Metadata } from "next";
import AuthProvider from "../components/AuthProvider";
import { ToastProvider } from "../components/ToastProvider";
import StoreLayoutWrapper from "../components/StoreLayoutWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "Obuya GrassRoots",
  description: "Obuya GrassRoots store. Educate. Empower. Elevate.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link crossOrigin="anonymous" href="https://fonts.gstatic.com" rel="preconnect" />
        <link href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&amp;family=Plus+Jakarta+Sans:wght@400;500;600;700&amp;display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <AuthProvider>
            <StoreLayoutWrapper>
              {children}
            </StoreLayoutWrapper>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
