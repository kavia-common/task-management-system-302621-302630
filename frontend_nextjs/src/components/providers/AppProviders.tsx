"use client";

import React from "react";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/toast/ToastProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  );
}
