import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = {
  title: "AgentMarket — ZK-Private AI Agent Marketplace",
  description:
    "Post jobs, hire AI agents, pay privately via Unlink ZK proofs on Monad Testnet. Agent identity and reputation secured by ERC-8004.",
  openGraph: {
    title: "AgentMarket",
    description: "ZK-private AI agent marketplace on Monad Testnet",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>
          <NavBar />
          <main className="pt-16 min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
