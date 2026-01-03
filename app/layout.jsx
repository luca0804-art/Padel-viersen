import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Padel Match",
  description: "Finde Padel-Spieler in deiner Nähe und verabrede Matches.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
