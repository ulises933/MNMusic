import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/ThemeProvider';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Music, Calendar, MessageSquare, Settings, Home, Search, Users,
  PlusCircle, User, FileText, Sun, Moon, Bell, LogOut, Menu, ChevronLeft,
  Shield, CreditCard, BarChart3, Cog, History, Crown, Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn, publicAsset } from '@/lib/utils';
import { useState } from 'react';

const musicianNav = [
  { label: 'Dashboard', icon: Home, path: '/m/dashboard' },
  { label: 'Eventos', icon: Search, path: '/m/events' },
  { label: 'Invitaciones', icon: Mail, path: '/m/invitations' },
  { label: 'Calendario', icon: Calendar, path: '/calendar' },
  { label: 'Mensajes', icon: MessageSquare, path: '/messages' },
  { label: 'Perfil', icon: User, path: '/m/profile' },
  { label: 'Historial', icon: History, path: '/history' },
  { label: 'Suscripción', icon: Crown, path: '/subscription' },
];

const organizerNav = [
  { label: 'Dashboard', icon: Home, path: '/o/dashboard' },
  { label: 'Mis Eventos', icon: FileText, path: '/o/events' },
  { label: 'Artistas', icon: Search, path: '/o/artists' },
  { label: 'Aplicaciones', icon: Users, path: '/o/applications' },
  { label: 'Invitaciones', icon: Mail, path: '/o/invitations' },
  { label: 'Mensajes', icon: MessageSquare, path: '/messages' },
  { label: 'Calendario', icon: Calendar, path: '/calendar' },
  { label: 'Historial', icon: History, path: '/history' },
  { label: 'Suscripción', icon: Crown, path: '/subscription' },
];

const userNav = [
  { label: 'Dashboard', icon: Home, path: '/u/dashboard' },
  { label: 'Artistas', icon: Search, path: '/u/artists' },
  { label: 'Mis Eventos', icon: FileText, path: '/u/events' },
  { label: 'Invitaciones', icon: Mail, path: '/u/invitations' },
  { label: 'Mensajes', icon: MessageSquare, path: '/messages' },
  { label: 'Historial', icon: History, path: '/history' },
  { label: 'Suscripción', icon: Crown, path: '/subscription' },
];

const adminNav = [
  { label: 'Dashboard', icon: BarChart3, path: '/admin/dashboard' },
  { label: 'Usuarios', icon: Users, path: '/admin/users' },
  { label: 'Eventos', icon: Calendar, path: '/admin/events' },
  { label: 'Artistas', icon: Music, path: '/admin/artists' },
  { label: 'Planes y Precios', icon: CreditCard, path: '/admin/plans' },
  { label: 'Pagos', icon: CreditCard, path: '/admin/payments' },
  { label: 'Configuración', icon: Cog, path: '/admin/settings' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { role, userName, userAvatar, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isAdminRoute = location.pathname.startsWith('/admin');
  
  const navItems = isAdminRoute && isAdmin
    ? adminNav
    : role === 'musician' ? musicianNav : role === 'organizer' ? organizerNav : userNav;
  
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const getDashboardPath = () => {
    if (isAdminRoute && isAdmin) return '/admin/dashboard';
    return role === 'musician' ? '/m/dashboard' : role === 'organizer' ? '/o/dashboard' : '/u/dashboard';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className={cn(
          "fixed left-0 top-0 bottom-0 border-r border-border bg-sidebar z-40 transition-all duration-300 flex flex-col safe-area-pt",
          sidebarOpen ? "w-64" : "w-16"
        )}>
          <div className={cn("h-16 flex items-center border-b border-border px-4", sidebarOpen ? "justify-between" : "justify-center")}>
            {sidebarOpen && (
              <Link to={getDashboardPath()} className="flex items-center gap-2">
                {isAdminRoute ? (
                  <div className="w-8 h-8 rounded-lg bg-destructive flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <img src={publicAsset("/logo.png")} alt="MN Music" className="w-8 h-8 rounded-lg object-cover" />
                )}
                <span className="font-display font-bold text-lg text-foreground">
                  {isAdminRoute ? 'MN Admin' : 'MN Music'}
                </span>
              </Link>
            )}
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="shrink-0">
              {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>

          <nav className="flex-1 py-4 px-2 space-y-1">
            {navItems.map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.path)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))}

            {!isAdminRoute && (role === 'organizer' || role === 'user') && (
              <button
                onClick={() => navigate(role === 'organizer' ? '/o/events/new' : '/u/events/new')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <PlusCircle className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span>Crear Evento</span>}
              </button>
            )}
          </nav>

          <div className="border-t border-border p-3 space-y-1">
            {/* Admin toggle */}
            {isAdmin && (
              <button
                onClick={() => navigate(isAdminRoute ? getDashboardPath().replace('/admin/', `/${role === 'musician' ? 'm' : role === 'organizer' ? 'o' : 'u'}/`) : '/admin/dashboard')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  "text-destructive hover:bg-destructive/10"
                )}
              >
                <Shield className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span>{isAdminRoute ? 'Salir de Admin' : 'Panel Admin'}</span>}
              </button>
            )}
            {!isAdminRoute && (
              <button
                onClick={() => navigate('/settings')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive('/settings')
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Settings className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span>Ajustes</span>}
              </button>
            )}
          </div>
        </aside>
      )}

      <div className={cn("flex-1 flex flex-col min-h-screen", !isMobile && (sidebarOpen ? "ml-64" : "ml-16"))}>
        <header className={cn(
          "sticky top-0 z-30 border-b bg-card/80 backdrop-blur-sm safe-area-pt",
          isAdminRoute ? "border-destructive/20" : "border-border"
        )}>
          <div className="h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            {isMobile && (
              <Link to={getDashboardPath()} className="flex items-center gap-2">
                {isAdminRoute ? (
                  <div className="w-8 h-8 rounded-lg bg-destructive flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <img src={publicAsset("/logo.png")} alt="MN Music" className="w-8 h-8 rounded-lg object-cover" />
                )}
                <span className="font-display font-bold text-lg">{isAdminRoute ? 'Admin' : 'MN Music'}</span>
              </Link>
            )}
            {isAdminRoute && !isMobile && (
              <Badge variant="destructive" className="text-xs">ADMIN</Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>

            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={userAvatar} />
                    <AvatarFallback>{userName?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  {!isMobile && <span className="text-sm font-medium">{userName}</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate(role === 'musician' ? '/m/profile' : role === 'organizer' ? '/o/profile' : '/u/profile')}>
                  <User className="w-4 h-4 mr-2" /> Mi Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="w-4 h-4 mr-2" /> Ajustes
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/admin/dashboard')}>
                      <Shield className="w-4 h-4 mr-2" /> Panel de Administración
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                  Rol: {role === 'musician' ? 'Artista' : role === 'organizer' ? 'Organizador' : 'Usuario'}
                  {isAdmin && ' (Admin)'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" /> Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          </div>
        </header>

        <main
          className={cn(
            'flex-1 p-4 lg:p-6',
            isMobile && 'pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]',
          )}
        >
          {children}
        </main>
      </div>

      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card safe-area-pb">
          <div className="flex h-16 items-center justify-around px-1">
          {navItems.slice(0, 5).map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg transition-colors min-w-0 flex-1",
                isActive(item.path) ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="text-[9px] sm:text-[10px] font-medium leading-tight text-center truncate max-w-full px-0.5">{item.label}</span>
            </button>
          ))}
          </div>
        </nav>
      )}
    </div>
  );
}
