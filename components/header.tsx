"use client"

import { LeafIcon } from "lucide-react"
import Link from "next/link"
import { UserMenu } from "./user-menu"

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="flex items-center space-x-2">
          <LeafIcon className="h-6 w-6 text-emerald-600 px-0 pl-0 ml-[25px]" />
          <span className="font-bold pl-0">Avalúos Agrícolas</span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
