import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { AppProvider } from "@/lib/context";
import { SessionProvider } from "@/components/SessionProvider";
import { LeftSidebar } from "@/components/LeftSidebar";
import { TopRightProfileLink } from "@/components/TopRightProfileLink";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pinpoint",
  description: "Housing on the map. Sublets and listings in one place — contact by email.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('pinpoint-theme');document.documentElement.classList.toggle('dark',t!=='light');})();`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <SessionProvider>
            <AppProvider>
              <LeftSidebar />
              <TopRightProfileLink />
              {children}
            </AppProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
