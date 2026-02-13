import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export function Header() {
  const { logout, isLoggingOut } = useAuth();

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link to="/" className="font-semibold text-lg">
          DOM Juan
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/settings">
            <Button variant="ghost" size="sm">Settings</Button>
          </Link>
          <Button
          variant="ghost"
          size="sm"
          onClick={() => logout()}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Signing out…' : 'Sign out'}
          </Button>
        </nav>
      </div>
    </header>
  );
}
