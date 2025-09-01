import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Mail, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl">¡Gracias por registrarte!</CardTitle>
              <CardDescription>Revisa tu correo para confirmar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Te has registrado exitosamente. Por favor revisa tu correo electrónico para confirmar tu cuenta antes de
                iniciar sesión.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <h4 className="font-medium text-amber-800">¿No recibiste el email?</h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• Revisa tu carpeta de spam o correo no deseado</li>
                      <li>• Verifica que escribiste correctamente tu email</li>
                      <li>• El email puede tardar unos minutos en llegar</li>
                      <li>• Algunos proveedores de email pueden bloquear emails automáticos</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Próximos pasos:</h4>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1. Busca el email de confirmación</li>
                  <li>2. Haz clic en el enlace de confirmación</li>
                  <li>3. Serás redirigido al panel de control</li>
                  <li>4. ¡Ya puedes comenzar a crear valuaciones!</li>
                </ol>
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/auth/sign-up">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Intentar con otro email
                  </Link>
                </Button>

                <Button asChild variant="ghost" className="w-full">
                  <Link href="/auth/login">¿Ya confirmaste tu cuenta? Iniciar sesión</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
