import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Real time Location',
  description: 'Real time Location',
 
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
