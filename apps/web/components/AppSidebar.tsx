import {
  LayoutDashboard,
  Users,
  Receipt,
  DollarSign,
  User,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
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
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Groups', url: '/groups', icon: Users },
  { title: 'Expenses', url: '/expenses', icon: Receipt },
  { title: 'Payments', url: '/payments', icon: DollarSign },
  { title: 'Profile', url: '/profile', icon: User },
];

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <div className="px-4 py-6 flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center font-bold text-primary-foreground">
            T
          </div>
          {open && (
            <span className="font-bold text-lg text-primary glow-green">
              TRADER
            </span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className={({ isActive }) =>
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : ''
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
