'use client';

import {
  LayoutDashboard,
  Users,
  Receipt,
  DollarSign,
  User,
  UserPlus,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@web/components/ui/sidebar';

const navItems = [
  { title: 'Dashboard', url: '/home', icon: LayoutDashboard },
  { title: 'Groups', url: '/groups', icon: Users },
  { title: 'Expenses', url: '/expenses', icon: Receipt },
  { title: 'Payments', url: '/payments', icon: DollarSign },
  { title: 'Friends', url: '/friends', icon: UserPlus },
  { title: 'Profile', url: '/profile', icon: User },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const pathname = usePathname();

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-border">
      <SidebarContent>
        <div className="px-4 py-6 flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center font-bold text-primary-foreground">
            <ArrowUpRight className="h-5 w-5 text-primary-foreground" />
          </div>
          {open && (
            <span className="font-bold text-lg text-primary glow-green">
              MONEY APP
            </span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.url}
                        className={
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : ''
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
