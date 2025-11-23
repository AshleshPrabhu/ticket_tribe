"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenuItem,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import { ChartBar, Users, Trophy, MessageSquare, Settings, ShieldCheck } from "lucide-react";

import { DashboardUserButton } from "./dashboard-user-button";
import { DashboardTrial } from "./dashboard-trial";

/**
 * TickerTribe Sidebar
 * - White theme friendly (uses your CSS variables)
 * - Routes: Dashboard, Predict, My Tribe, Leaderboard, Chat, Settings
 * - Mobile behaves via your SidebarProvider/sheet
 */

const PRIMARY = [
  { icon: ShieldCheck, label: "Predict", href: "/predict" },
  { icon: Users, label: "My Tribe", href: "/tribe" },
  { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
  // { icon: Settings, label: "Settings", href: "/settings" },
];

export const DashboardSidebar = () => {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="text-sidebar-foreground/90 px-2">
        <Link href="/" className="flex items-center gap-3 px-2 pt-2">
          <Image src="/logo.svg" width={36} height={36} alt="TickerTribe" />
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-semibold text-primary">TickerTribe</span>
            <span className="text-xs text-muted-foreground -mt-0.5">Predict • Compete • Win</span>
          </div>
        </Link>
      </SidebarHeader>

      <div className="px-4 py-2">
        <SidebarSeparator className="opacity-50" />
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {PRIMARY.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={cn(
                        "h-10",
                        active ? "bg-white border border-border" : "hover:bg-main-muted/50"
                      )}
                    >
                      <Link href={item.href} className="flex items-center gap-3 w-full">
                        <Icon className="size-5 text-primary" />
                        <span className="text-sm font-medium tracking-tight text-main-foreground">{item.label}</span>
                        {/* show a badge for Predict as example */}
                        {item.label === "Predict" && (
                          <SidebarMenuBadge className="bg-primary-foreground text-white">LIVE</SidebarMenuBadge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="px-4 py-1">
          <SidebarSeparator className="opacity-50" />
        </div>

      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="space-y-3">
          <div className="pt-2">
            <DashboardUserButton />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
