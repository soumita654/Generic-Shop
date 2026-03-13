import { ReactNode } from "react";
import { Header } from "./Header";
import { AIChatWidget } from "@/components/chat/AIChatWidget";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="mt-12 border-t border-border/70 bg-card/60 py-7 text-center text-sm text-muted-foreground backdrop-blur-md">
        © 2026 GenericShop. All rights reserved.
      </footer>
      <AIChatWidget />
    </div>
  );
}
