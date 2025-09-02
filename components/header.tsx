"use client"

import { LeafIcon } from "lucide-react"
import Link from "next/link"
import { UserMenu } from "./user-menu"

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <LeafIcon className="h-6 w-6 text-emerald-600" />
          <span className="font-bold">Avalúos Agrícolas</span>
        </Link>
        <div className="flex items-center">
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
