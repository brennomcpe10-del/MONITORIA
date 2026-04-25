import * as React from "react"

export const ScrollArea = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`relative overflow-auto ${className}`} {...props}>
    {children}
  </div>
)