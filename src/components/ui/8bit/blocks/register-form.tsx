import * as React from "react";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { useAuthStore } from "@/stores/authStore";
import { authLogger } from "@/lib/utils/logger";

import { Button } from "@/components/ui/8bit/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState } from "@/components/LoadingState";

export function RegisterForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const navigate = useNavigate();
  const { register: registerUser, loading, error } = useAuthStore();

  // Initialize state directly from sessionStorage (runs on every mount)
  // This handles the case where component remounts after auth state changes
  const [verificationEmail, setVerificationEmail] = React.useState<string | null>(
    () => sessionStorage.getItem('pendingVerificationEmail')
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data.email, data.password, data.name);
    } catch (error: any) {
      if (error.message === 'VERIFICATION_EMAIL_SENT') {
        // Update local state to show verification screen
        setVerificationEmail(data.email);
      } else {
        authLogger.error('Register error', error);
      }
    }
  };

  const handleGoToLogin = () => {
    // Clear the pending verification from sessionStorage
    sessionStorage.removeItem('pendingVerificationEmail');
    navigate('/');
  };

  // Show verification sent message
  if (verificationEmail) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Verifica tu email</CardTitle>
            <CardDescription className="text-xs">
              Hemos enviado un correo de verificacion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 text-center">
              <div className="p-4 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-800">
                  Se ha enviado un enlace de verificacion a:
                </p>
                <p className="font-semibold text-green-900 mt-1">
                  {verificationEmail}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Revisa tu bandeja de entrada (y spam) y haz clic en el enlace para activar tu cuenta.
              </p>
              <Button variant="outline" className="w-full" onClick={handleGoToLogin}>
                Ir a Iniciar Sesion
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Registro</CardTitle>
          <CardDescription className="text-xs">
            Crea tu cuenta para empezar a jugar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                  {error}
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="name">Nombre de Usuario</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="jugador123"
                  {...register("name")}
                  disabled={loading}
                />
                {errors.name && (
                  <p className="text-xs text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  {...register("email")}
                  disabled={loading}
                />
                {errors.email && (
                  <p className="text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  disabled={loading}
                />
                {errors.password && (
                  <p className="text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword")}
                  disabled={loading}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <LoadingState
                    variant="compact"
                    message="Creando cuenta..."
                    className="justify-center"
                  />
                ) : (
                  'Registrarse'
                )}
              </Button>
            </div>

            <div className="mt-4 text-center text-xs">
              ¿Ya tienes una cuenta?{" "}
              <Link to="/" className="underline underline-offset-4">
                Inicia sesión
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
