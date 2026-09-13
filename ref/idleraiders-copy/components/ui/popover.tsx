'use client'

import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

function PopoverClose({
  className,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Close>) {
  return (
    <PopoverPrimitive.Close
      data-slot="popover-close"
      className={cn(className)}
      {...props}
    />
  )
}

interface PopoverHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

function PopoverHeader({ className, ...props }: PopoverHeaderProps) {
  return (
    <div
      data-slot="popover-header"
      className={cn(
        'flex items-center gap-3 border-b border-border px-4 py-3',
        className
      )}
      {...props}
    />
  )
}

interface PopoverTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

function PopoverTitle({ className, ...props }: PopoverTitleProps) {
  return (
    <h4
      data-slot="popover-title"
      className={cn('font-display text-sm font-semibold text-foreground', className)}
      {...props}
    />
  )
}

interface PopoverDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

function PopoverDescription({ className, ...props }: PopoverDescriptionProps) {
  return (
    <p
      data-slot="popover-description"
      className={cn('text-xs text-muted-foreground', className)}
      {...props}
    />
  )
}

interface PopoverBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

function PopoverBody({ className, ...props }: PopoverBodyProps) {
  return (
    <div
      data-slot="popover-body"
      className={cn('px-4 py-3', className)}
      {...props}
    />
  )
}

interface PopoverFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

function PopoverFooter({ className, ...props }: PopoverFooterProps) {
  return (
    <div
      data-slot="popover-footer"
      className={cn('border-t border-border px-4 py-3', className)}
      {...props}
    />
  )
}

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverClose,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverBody,
  PopoverFooter,
}
