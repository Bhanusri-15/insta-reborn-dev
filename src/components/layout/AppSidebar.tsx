import { Home, Search, Compass, Film, MessageCircle, Heart, PlusSquare, User, Settings, Instagram, Moon, Sun, LogOut } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const mainItems = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'Search', url: '/search', icon: Search },
  { title: 'Explore', url: '/explore', icon: Compass },
  { title: 'Reels', url: '/reels', icon: Film },
  { title: 'Messages', url: '/messages', icon: MessageCircle },
  { title: 'Notifications', url: '/notifications', icon: Heart },
  { title: 'Create', url: '/create', icon: PlusSquare },
  { title: 'Profile', url: '/profile', icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <NavLink to="/" className="flex items-center gap-2 no-underline">
          <Instagram className="h-6 w-6 text-foreground shrink-0" />
          {!collapsed && (
            <span className="text-xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Segoe UI', sans-serif" }}>
              Network
            </span>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink to={item.url} className="hover:bg-muted/50" activeClassName="bg-muted font-semibold">
                      <item.icon className="h-6 w-6 shrink-0" />
                      {!collapsed && <span className="text-base">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 space-y-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-6 w-6 shrink-0" /> : <Moon className="h-6 w-6 shrink-0" />}
              {!collapsed && <span className="text-base">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/settings" className="hover:bg-muted/50" activeClassName="bg-muted font-semibold">
                <Settings className="h-6 w-6 shrink-0" />
                {!collapsed && <span className="text-base">Settings</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut}>
              <LogOut className="h-6 w-6 shrink-0" />
              {!collapsed && <span className="text-base">Log out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
