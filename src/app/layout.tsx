import "~/styles/globals.css";

import { type Metadata } from "next";
import * as fonts from "~/components/fonts";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "Gamin",
  description: "Game platform by DCRalph Enterprises",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};


export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fonts.inter.className} scroll-smooth antialiased dark`} suppressHydrationWarning>
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
