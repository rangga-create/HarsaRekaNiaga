"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/firebase-store";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#f5f0e1]">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="items-center">
          <Image src="/logo.webp" alt="Harsa Reka Niaga" width={64} height={64} className="w-16 h-16 rounded-[4px] object-contain mb-2" />
          <CardTitle className="text-center text-black">Masuk</CardTitle>
          <CardDescription className="text-center text-sm text-[#333]">
            Harsa Reka Niaga — Export Business Workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rangga@harsarekaniaga.id"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="p-3 rounded-[4px] border border-red-200 bg-red-50 text-sm text-red-800">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center text-sm">
          <p className="text-[#333]">
            Akses hanya untuk admin yang diizinkan.
          </p>
          <Link href="/" className="underline underline-offset-4 hover:text-black">
            Kembali ke beranda
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
