import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { SITE_URL, SOCIAL_IMAGE } from "@/lib/site";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  axes: ["opsz"],
});

const MARK_SIGNED_IN = `try{var c=document.cookie.split("; "),s=null,u=null;for(var i=0;i<c.length;i++){var p=c[i].split("=");if(p[0].indexOf("__client_uat_")===0)s=p[1];else if(p[0]==="__client_uat")u=p[1]}if(parseInt(s!==null?s:u,10)>0||/[?&]sso_callback=/.test(location.search))document.documentElement.setAttribute("data-signed-in","")}catch(e){}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "Screeny",
  title: "App Store Screenshot, Icon & Mascot Inspiration | Screeny",
  description:
    "Explore a hand-picked gallery of App Store screenshots, app icons, and apps with mascots. Find visual inspiration for your next iOS app.",
  alternates: { canonical: "/" },
  icons: {
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Screeny",
    title: "App Store Screenshot, Icon & Mascot Inspiration | Screeny",
    description:
      "Explore a hand-picked gallery of App Store screenshots, app icons, and apps with mascots. Find visual inspiration for your next iOS app.",
    images: [{ url: SOCIAL_IMAGE, width: 1200, height: 630, alt: "Screeny — App Store screenshot, icon, and mascot inspiration" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "App Store Screenshot, Icon & Mascot Inspiration | Screeny",
    description:
      "Explore a hand-picked gallery of App Store screenshots, app icons, and apps with mascots. Find visual inspiration for your next iOS app.",
    images: [SOCIAL_IMAGE],
    creator: "@watermelonCodes",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: MARK_SIGNED_IN }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: "Screeny", description: "A hand-picked gallery of App Store screenshots, app icons, and app mascots." },
                { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "Screeny", url: SITE_URL },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ClerkProvider signInUrl="/?login=1" signUpUrl="/?login=1">
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
