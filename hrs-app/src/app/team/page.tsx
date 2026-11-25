"use client";

import { Mail, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useUsers } from "@/lib/firebase-store";


export default function TeamPage() {
  const { list: users } = useUsers();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-brand-forest text-white">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-black">
              Team Profile
            </h1>
            <p className="mt-1 text-sm text-[#333]">
              The people behind Harsa Reka Niaga.
            </p>
          </div>
        </div>      </div>

      {users.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {users.map((user) => {
            const initials = user.name
              .split(/\s+/)
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return (
              <Card key={user.id} className="border-black">
                <CardContent className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={user.avatar || undefined} alt={user.name} />
                    <AvatarFallback className="bg-brand-forest/10 font-semibold text-black">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold text-black">{user.name}</h2>
                    <p className="mt-0.5 text-sm text-[#333]">{user.role}</p>
                    {user.email && (
                      <a
                        href={`mailto:${user.email}`}
                        className="mt-2 inline-flex items-center gap-1.5 text-sm text-[#333] hover:text-black"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">{user.email}</span>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-black">
          <CardContent className="py-12 text-center text-sm text-[#333]">
            No team profiles are available.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
