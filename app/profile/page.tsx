"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Header } from "@/components/header"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export default function ProfilePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      setUser(user)
      setIsLoading(false)
    }

    getUser()
  }, [supabase.auth, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="flex items-center justify-center">
            <div className="animate-pulse">Cargando...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Get user initials for avatar
  const getInitials = (email: string) => {
    return email.split("@")[0].slice(0, 2).toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Mi Perfil</h1>
            <p className="text-muted-foreground">Información de tu cuenta y configuración</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg">
                    {getInitials(user.email || "")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>Información de la Cuenta</CardTitle>
                  <CardDescription>Detalles de tu cuenta de usuario</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input id="email" type="email" value={user.email || ""} disabled className="bg-muted" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="user-id">ID de Usuario</Label>
                <Input id="user-id" value={user.id} disabled className="bg-muted font-mono text-xs" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="created-at">Cuenta Creada</Label>
                <Input id="created-at" value={formatDate(user.created_at)} disabled className="bg-muted" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="last-sign-in">Último Acceso</Label>
                <Input
                  id="last-sign-in"
                  value={user.last_sign_in_at ? formatDate(user.last_sign_in_at) : "Nunca"}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email-confirmed">Estado del Email</Label>
                <Input
                  id="email-confirmed"
                  value={user.email_confirmed_at ? "Confirmado" : "Pendiente de confirmación"}
                  disabled
                  className="bg-muted"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Volver al Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
