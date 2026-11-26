"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  Users,
  Package,
  Calculator,
  Percent,
  TrendingUp,
  UserCircle,
  Settings,
  Search,
  Bell,
  ChevronRight,
  Home,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Grid3x3,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn, statusDotClass, daysUntil } from "@/lib/utils";
import { useDemoStore, useFollowUps, useUsers, useAuth, useBuyerRequests } from "@/lib/firebase-store";
import { format } from "date-fns";

const NAV_MAIN = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/suppliers", label: "Suppliers", icon: Building2 },
  { href: "/buyers", label: "Buyers", icon: Users },
  { href: "/requests", label: "Kebutuhan Buyer", icon: ClipboardList },
  { href: "/products", label: "Products", icon: Package },
];

const NAV_TOOLS = [
  { href: "/calculator", label: "Export Calculator", icon: Calculator },
  { href: "/calculator/local", label: "Local / Agent Calculator", icon: TrendingUp },
  { href: "/commissions", label: "Commission Tracker", icon: Percent },
];

const NAV_SYSTEM = [
  { href: "/team", label: "Team Profile", icon: UserCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, loading: authLoading, logout, isAdmin } = useAuth();
  const isAuthed = !!authUser && isAdmin;
  const { data } = useDemoStore();
  const { list: followUps } = useFollowUps();
  const { list: users } = useUsers();
  const { list: buyerRequests } = useBuyerRequests();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthed) {
      router.replace("/login");
    }
  }, [authLoading, isAuthed, router]);

  const currentUser = useMemo(() => {
    if (authUser) {
      const match = users.find((u) => u.email === authUser.email);
      return {
        id: authUser.uid,
        name: match?.name || authUser.displayName || authUser.email?.split("@")[0] || "Admin",
        email: authUser.email || "",
        role: match?.role || "Admin",
        avatar: (match as { avatar?: string } | undefined)?.avatar || authUser.photoURL || "",
      };
    }
    return users[0] ?? {
      id: "guest",
      name: "Admin",
      email: "admin@harsarekaniaga.id",
      role: "Admin",
      avatar: "",
    };
  }, [authUser, users]);

  const upcomingFollowUps = useMemo(() => {
    return followUps
      .filter(
        (f) =>
          f.scheduledAt && !f.completedAt && f.demo !== false
      )
      .slice(0, 5)
      .map((f) => {
        try {
          return {
            ...f,
            date: format(new Date(f.scheduledAt), "dd LLL yyyy"),
          };
        } catch {
          return { ...f, date: f.scheduledAt };
        }
      });
  }, [followUps]);

  const urgentRequests = useMemo(() => {
    return buyerRequests
      .filter((r) => r.status !== "Closed" && !!r.neededBy)
      .map((r) => ({ id: r.id, title: r.title, days: daysUntil(r.neededBy) }))
      .filter((r): r is { id: string; title: string; days: number } => r.days !== null && r.days <= 7)
      .sort((a, b) => a.days - b.days)
      .slice(0, 5);
  }, [buyerRequests]);

  const handleSearch = (href: string) => {
    setSearchOpen(false);
    router.push(href);
  };

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (authLoading || !isAuthed) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f5f0e1] text-sm text-[#333]">
        Loading workspaceâ€¦
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-[#f5f0e1] overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            "hidden lg:flex flex-col border-r-[3px] border-black bg-[#fffdf5] z-30 transition-all duration-200",
            "shrink-0",
            mobileOpen
              ? "fixed inset-y-0 left-0 w-64 shadow-[6px_0_0_#111]"
              : "w-[260px]"
          )}
        >
          {/* Brand */}
          <div className="flex items-center gap-3 px-5 h-20 border-b-[3px] border-black bg-[#ffe66d]">
            <Image src="/logo.webp" alt="Harsa Reka Niaga" width={40} height={40} className="w-10 h-10 rounded-[4px] border-2 border-black bg-[#fffdf5] object-contain p-0.5" />
            <div className="truncate">
              <div className="font-heading text-xl text-black tracking-wide leading-none">
                HARSA REKA
              </div>
              <div className="text-[11px] font-bold text-black/80 truncate uppercase tracking-wider">
                Export Manga Workspace
              </div>
            </div>
          </div>

          {/* Main nav */}
          <div className="flex-1 overflow-y-auto sidebar-scroll px-3 py-4">
            <nav className="space-y-1">
              <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-black mb-2 mt-1">
                Main
              </div>
              {NAV_MAIN.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-[4px] px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-black transition-all cursor-pointer border-2 border-transparent",
                    pathname === href
                      ? "bg-[#ffe66d] border-black shadow-[2px_2px_0_#111]"
                      : "hover:bg-[#fff3a3] hover:border-black hover:shadow-[2px_2px_0_#111]"
                  )}
                >
                  <Icon className={cn("w-5 h-5 shrink-0", pathname === href ? "text-black" : "text-black/80")} />
                  {label}
                </Link>
              ))}

              <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-black mb-2 mt-6">
                Business Tools
              </div>
              {NAV_TOOLS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-[4px] px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-black transition-all cursor-pointer border-2 border-transparent",
                    pathname === href
                      ? "bg-[#ffe66d] border-black shadow-[2px_2px_0_#111]"
                      : "hover:bg-[#fff3a3] hover:border-black hover:shadow-[2px_2px_0_#111]"
                  )}
                >
                  <Icon className={cn("w-5 h-5 shrink-0", pathname === href ? "text-black" : "text-black/80")} />
                  {label}
                </Link>
              ))}

              <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-black mb-2 mt-6">
                System
              </div>
              {NAV_SYSTEM.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-[4px] px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-black transition-all cursor-pointer border-2 border-transparent",
                    pathname === href
                      ? "bg-[#ffe66d] border-black shadow-[2px_2px_0_#111]"
                      : "hover:bg-[#fff3a3] hover:border-black hover:shadow-[2px_2px_0_#111]"
                  )}
                >
                  <Icon className={cn("w-5 h-5 shrink-0", pathname === href ? "text-black" : "text-black/80")} />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="mt-6 px-3">
              <Separator className="bg-black h-[3px]" />
              <div className="mt-4 rounded-[4px] border-2 border-black bg-[#fff3a3] p-3 text-xs text-black leading-relaxed shadow-[2px_2px_0_#111]">
                <p className="font-heading text-base leading-none">Harsa Reka Niaga</p>
                <p className="text-[11px] font-bold uppercase mt-1">Manga Mode</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile drawer overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Mobile sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 w-[260px] bg-[#fffdf5] border-r border-black transform transition-transform duration-200 lg:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between px-5 h-16 border-b border-black">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-[4px] bg-brand-forest text-white">
                <Grid3x3 className="w-5 h-5" />
              </div>
              <div className="truncate">
                <div className="font-semibold text-sm text-black tracking-tight">
                  HARSA REKA NIAGA
                </div>
                <div className="text-[11px] text-[#333] truncate">
                  Export Business Workspace
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => setMobileOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <ScrollArea className="h-[calc(100%-4rem)]">
            <nav className="px-3 py-4 space-y-1">
              {NAV_MAIN.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-[4px] px-3 py-2.5 text-sm font-medium text-brand-foreground transition-colors cursor-pointer",
                    pathname === href
                      ? "bg-brand-forest/5 text-black border-l-2 border-brand-forest -ml-0.5 pl-[14px]"
                      : "text-[#333] hover:bg-[#ffe66d] hover:text-brand-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 shrink-0",
                      pathname === href
                        ? "text-black"
                        : "text-[#333] group-hover:text-black"
                    )}
                  />
                  {label}
                </Link>
              ))}
              {NAV_TOOLS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-[4px] px-3 py-2.5 text-sm font-medium text-brand-foreground transition-colors cursor-pointer",
                    pathname === href
                      ? "bg-brand-forest/5 text-black border-l-2 border-brand-forest -ml-0.5 pl-[14px]"
                      : "text-[#333] hover:bg-[#ffe66d] hover:text-brand-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 shrink-0",
                      pathname === href
                        ? "text-black"
                        : "text-[#333] group-hover:text-black"
                    )}
                  />
                  {label}
                </Link>
              ))}
              {NAV_SYSTEM.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-[4px] px-3 py-2.5 text-sm font-medium text-brand-foreground transition-colors cursor-pointer",
                    pathname === href
                      ? "bg-brand-forest/5 text-black border-l-2 border-brand-forest -ml-0.5 pl-[14px]"
                      : "text-[#333] hover:bg-[#ffe66d] hover:text-brand-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 shrink-0",
                      pathname === href
                        ? "text-black"
                        : "text-[#333] group-hover:text-black"
                    )}
                  />
                  {label}
                </Link>
              ))}
            </nav>
          </ScrollArea>
        </aside>

        {/* Main area */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Header */}
          <header className="h-16 border-b border-black bg-[#fffdf5] flex items-center justify-between px-4 lg:px-6 shrink-0">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 -ml-2 lg:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="hidden sm:flex items-center gap-2 text-sm text-[#333]">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1 hover:text-black transition-colors cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-brand-foreground font-medium truncate max-w-[200px] sm:max-w-[300px]">
                  {NAV_MAIN.find((n) => n.href === pathname)?.label ??
                    NAV_TOOLS.find((n) => n.href === pathname)?.label ??
                    NAV_SYSTEM.find((n) => n.href === pathname)?.label ??
                    "Workspace"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Global search */}
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-[220px] lg:w-[260px] justify-start text-[#333] gap-2"
                    />
                  }
                >
                    <Search className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      Search suppliers, buyersâ€¦
                    </span>
                    <kbd className="ml-auto hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-black bg-brand-muted text-[11px] font-mono text-[#333]">
                      âŒ˜K
                    </kbd>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[540px] p-0 overflow-hidden"
                  align="end"
                >
                  <Command>
                    <CommandInput
                      placeholder="Search across suppliers, buyers, productsâ€¦"
                      ref={inputRef}
                      onSelect={(value) => {
                        if (value) handleSearch(String(value));
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <div className="px-4 py-6 text-sm text-[#333] text-center">
                          No results found.
                        </div>
                      </CommandEmpty>
                      <CommandGroup heading="Suppliers">
                        {data.suppliers.slice(0, 6).map((s) => (
                          <CommandItem
                            key={s.id}
                            value={`/suppliers/${s.id}`}
                            onSelect={() =>
                              handleSearch(`/suppliers/${s.id}`)
                            }
                            className="gap-2"
                          >
                            <Building2 className="w-4 h-4 text-[#333]" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {s.companyName}
                              </span>
                              <span className="text-xs text-[#333]">
                                {s.country}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandGroup heading="Buyers">
                        {data.buyers.slice(0, 6).map((b) => (
                          <CommandItem
                            key={b.id}
                            value={`/buyers/${b.id}`}
                            onSelect={() =>
                              handleSearch(`/buyers/${b.id}`)
                            }
                            className="gap-2"
                          >
                            <Users className="w-4 h-4 text-[#333]" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {b.companyName}
                              </span>
                              <span className="text-xs text-[#333]">
                                {b.country}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandGroup heading="Products">
                        {data.products.slice(0, 6).map((p) => (
                          <CommandItem
                            key={p.id}
                            value={`/products/${p.id}`}
                            onSelect={() =>
                              handleSearch(`/products/${p.id}`)
                            }
                            className="gap-2"
                          >
                            <Package className="w-4 h-4 text-[#333]" />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {p.productName}
                              </span>
                              <span className="text-xs text-[#333]">
                                {p.productCategory}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandGroup heading="Quick links">
                        <CommandItem
                          value="/dashboard"
                          onSelect={() => handleSearch("/dashboard")}
                          className="gap-2"
                        >
                          <Home className="w-4 h-4 text-[#333]" />
                          <span className="text-sm">Dashboard</span>
                        </CommandItem>
                        <CommandItem
                          value="/calculator"
                          onSelect={() => handleSearch("/calculator")}
                          className="gap-2"
                        >
                          <Calculator className="w-4 h-4 text-[#333]" />
                          <span className="text-sm">Export Calculator</span>
                        </CommandItem>
                        <CommandItem
                          value="/commissions"
                          onSelect={() => handleSearch("/commissions")}
                          className="gap-2"
                        >
                          <Percent className="w-4 h-4 text-[#333]" />
                          <span className="text-sm">
                            Commission Tracker
                          </span>
                        </CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Notifications */}
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-9 h-9 relative"
                    />
                  }
                >
                    <Bell className="w-5 h-5 text-[#333]" />
                    {(upcomingFollowUps.length > 0 || urgentRequests.length > 0) && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-gold ring-2 ring-white" />
                    )}
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 p-0 overflow-hidden"
                  align="end"
                >
                  <div className="px-4 py-3 border-b border-black">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                  </div>
                  <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
                    {upcomingFollowUps.length === 0 && urgentRequests.length === 0 && (
                      <div className="px-4 py-6 text-sm text-[#333] text-center">
                        Tidak ada notifikasi.
                      </div>
                    )}
                    {urgentRequests.length > 0 && (
                      <div className="px-2 pt-1 pb-1 text-[11px] font-bold uppercase tracking-wider text-[#333]">
                        Deadline Kebutuhan
                      </div>
                    )}
                    {urgentRequests.map((r) => {
                      const overdue = r.days < 0;
                      return (
                        <div
                          key={r.id}
                          className="flex items-start gap-3 p-2 rounded-[4px] border border-transparent hover:border-black hover:bg-brand-muted/40 cursor-pointer transition-colors"
                          onClick={() => {
                            router.push(`/requests/${r.id}`);
                            setMobileOpen(false);
                          }}
                        >
                          <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", overdue ? "bg-red-500" : "bg-amber-500")} />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{r.title}</div>
                            <div className="text-xs text-[#333] mt-0.5">{overdue ? "Lewat deadline" : "Mendekati deadline"}</div>
                          </div>
                          <Badge variant="secondary" className={cn("shrink-0 text-[11px]", overdue ? "bg-red-50 text-red-800 border-red-200" : "bg-amber-50 text-amber-800 border-amber-200")}>
                            {overdue ? `${Math.abs(r.days)} hari lewat` : `${r.days} hari lagi`}
                          </Badge>
                        </div>
                      );
                    })}
                    {upcomingFollowUps.length > 0 && (
                      <div className="px-2 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-[#333]">
                        Follow-up
                      </div>
                    )}
                    {upcomingFollowUps.map((f) => {
                      const buyer = data.buyers.find(
                        (b) => b.id === f.buyerId
                      );
                      return (
                        <div
                          key={f.id}
                          className="flex items-start gap-3 p-2 rounded-[4px] border border-transparent hover:border-black hover:bg-brand-muted/40 cursor-pointer transition-colors"
                          onClick={() => {
                            router.push(`/buyers/${f.buyerId}`);
                            setMobileOpen(false);
                          }}
                        >
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full mt-1.5 shrink-0",
                              statusDotClass(
                                buyer?.buyerStatus ?? "New Lead"
                              )
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">
                              {f.note}
                            </div>
                            <div className="text-xs text-[#333] mt-0.5">
                              {buyer
                                ? `${buyer.companyName} Â· ${f.date}`
                                : f.date}
                            </div>
                          </div>
                          <Badge variant="secondary" className="shrink-0 text-[11px]">
                            {f.date}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                  {(upcomingFollowUps.length > 0 || urgentRequests.length > 0) && (
                    <div className="px-4 py-2 border-t border-black text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-black w-full"
                        onClick={() => {
                          router.push(urgentRequests.length > 0 ? "/requests" : "/buyers");
                          setMobileOpen(false);
                        }}
                      >
                        {urgentRequests.length > 0 ? "Lihat kebutuhan" : "View all buyers"}
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              {/* Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 rounded-full pl-2 pr-3 h-9"
                    />
                  }
                >
                    <Avatar className="h-7 w-7 border border-black">
                      <AvatarImage
                        src={currentUser.avatar || undefined}
                      />
                      <AvatarFallback className="bg-brand-forest/10 text-black text-xs font-semibold">
                        {currentUser.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium leading-tight">
                        {currentUser.name}
                      </div>
                      <div className="text-[11px] text-[#333] leading-tight">
                        {currentUser.role}
                      </div>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <div className="text-sm font-medium">
                      {currentUser.name}
                    </div>
                    <div className="text-xs text-[#333]">
                      {currentUser.email}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/team")}
                  >
                    <UserCircle className="w-4 h-4 mr-2" />
                    Team Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/settings")}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600" onClick={async () => { await logout(); router.push("/login"); }}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

