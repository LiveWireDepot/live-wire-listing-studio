import type {Metadata} from "next"; import "./globals.css"; import "./nav-contrast.css";
export const metadata:Metadata={title:"Live Wire Batch Listing Studio",description:"Group mixed photographs into evidence-linked, guide-compliant antique listing drafts."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}

