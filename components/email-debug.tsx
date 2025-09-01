"use client"

export function EmailDebugInfo() {
  const devRedirectUrl = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "N/A"

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h3 className="font-semibold text-yellow-800 mb-2">Configuración de Email</h3>
      <div className="text-sm text-yellow-700 space-y-1">
        <p>
          <strong>URL de desarrollo:</strong> {devRedirectUrl || "No configurada"}
        </p>
        <p>
          <strong>Origen actual:</strong> {currentOrigin}
        </p>
        <p>
          <strong>URL de redirección:</strong> {devRedirectUrl || `${currentOrigin}/dashboard`}
        </p>
      </div>
    </div>
  )
}
