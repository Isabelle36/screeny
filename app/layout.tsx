import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  axes: ["opsz"],
});

const MARK_SIGNED_IN = `try{var c=document.cookie.split("; "),s=null,u=null;for(var i=0;i<c.length;i++){var p=c[i].split("=");if(p[0].indexOf("__client_uat_")===0)s=p[1];else if(p[0]==="__client_uat")u=p[1]}if(parseInt(s!==null?s:u,10)>0||/[?&]sso_callback=/.test(location.search))document.documentElement.setAttribute("data-signed-in","")}catch(e){}`;

export const metadata: Metadata = {
  title: "Screeny — App Store screenshot inspiration",
  description: "App Store screenshots, actually worth stealing from.",
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
      </head>
      <body className="min-h-full flex flex-col">
        <ClerkProvider signInUrl="/?login=1" signUpUrl="/?login=1">
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}