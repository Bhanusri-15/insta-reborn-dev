import { Home, Search, PlusSquare, Film, User } from 'lucide-react';
import { NavLink } from '@/components/NavLink';

const items = [
  { url: '/', icon: Home },
  { url: '/search', icon: Search },
  { url: '/create', icon: PlusSquare },
  { url: '/reels', icon: Film },
  { url: '/profile', icon: User },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around border-t border-border bg-background py-2">
      {items.map((item) => (
        <NavLink
          key={item.url}
          to={item.url}
          className="p-2 text-muted-foreground"
          activeClassName="text-foreground"
        >
          <item.icon className="h-6 w-6" />
        </NavLink>
      ))}
    </nav>
  );
}
