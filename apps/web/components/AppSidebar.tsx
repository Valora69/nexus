'use client';

import {
  LayoutDashboard,
  Users,
  Receipt,
  DollarSign,
  CircleUser,
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
  { title: 'Account', url: '/profile', icon: CircleUser },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const pathname = usePathname();

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-border">
      <SidebarContent>
        <div className="h-14 px-4 flex items-center gap-2.5 border-b border-sidebar-border">
          <div className="h-7 w-7 rounded bg-primary flex items-center justify-center shrink-0">
            <ArrowUpRight className="h-4 w-4 text-primary-foreground" />
          </div>
          {open && (
            <span className="font-light text-base text-primary tracking-wide">
              MONEY APP
            </span>
          )}
        </div>

        <SidebarGroup className="pt-4">
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
                            ? 'border-l-2 border-primary bg-sidebar-accent text-sidebar-accent-foreground pl-[calc(0.75rem-2px)]'
                            : 'border-l-2 border-transparent'
                        }
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="font-light">{item.title}</span>
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
