import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Book, Search, Globe, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import FriendlyAdviceModal from './FriendlyAdviceModal';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const location = useLocation();

  const navItems = [
    { name: 'Heatmap', path: '/', icon: LayoutDashboard },
    { name: 'Lexicon', path: '/lexicon', icon: Book },
    { name: 'Query', path: '/query', icon: Search },
    { name: 'Etymology', path: '/etymology', icon: Globe },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
      <FriendlyAdviceModal />

      {/* Sidebar */}
      <aside
        className={cn('flex flex-col transition-all duration-300 ease-in-out', isSidebarOpen ? 'w-72' : 'w-20')}
        style={{ backgroundColor: '#F9F9F8', borderRight: '1px solid #E5E5E5' }}
      >
        <div className="flex items-center justify-between px-5 py-6">
          {isSidebarOpen && (
            <span className="font-display" style={{ fontSize: '22px', fontWeight: 400, color: '#1a1a1a' }}>
              Beelzebub's Tales
            </span>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded"
            style={{ color: '#6b7280' }}
          >
            {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-2 py-2">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center px-4 py-3.5 rounded transition-colors"
                style={{
                  fontSize: '22px',
                  fontWeight: 400,
                  color: active ? '#6B3E1A' : '#6b7280',
                  backgroundColor: active ? '#F5EDE4' : 'transparent',
                  borderLeft: active ? '2px solid #6B3E1A' : '2px solid transparent',
                  gap: '14px',
                }}
              >
                <item.icon size={22} className="shrink-0" />
                {isSidebarOpen && (
                  <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header
          className="h-14 flex items-center px-8"
          style={{ borderBottom: '1px solid #E5E5E5', backgroundColor: '#FFFFFF' }}
        >
          <span style={{ fontSize: '22px', fontWeight: 400, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            The Legominist Explorer
          </span>
        </header>

        <section className="flex-1 overflow-y-auto p-8">
          {children}
        </section>
      </main>
    </div>
  );
};

export default Layout;
