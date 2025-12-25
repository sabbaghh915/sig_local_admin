import * as React from "react";
import { cn } from "../../lib/utils";

export const Dialog = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const DialogTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const DialogContent = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <div className={cn("fixed inset-0 z-50 flex items-center justify-center bg-black/40", className)}>
    <div className="rounded-lg bg-white p-6 shadow-lg">{children}</div>
  </div>
);

export const DialogHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4">{children}</div>
);

export const DialogTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-lg font-bold">{children}</h2>
);
