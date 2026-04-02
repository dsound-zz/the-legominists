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
    <div className="flex h-screen bg-bg-deep overflow-hidden">
      <FriendlyAdviceModal />
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-bg-card border-r border-white/5 transition-all duration-300 ease-in-out",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between">
            {isSidebarOpen && (
              <span className="text-xl font-bold tracking-wider text-brand-gold">
                BEELZEBUB
              </span>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-2 py-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-lg transition-colors group",
                  location.pathname === item.path
                    ? "bg-brand-gold/10 text-brand-gold"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                <item.icon className="shrink-0" size={20} />
                {isSidebarOpen && (
                  <span className="ml-3 font-medium text-sm">{item.name}</span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-white/5 flex items-center px-8 bg-bg-deep/50 backdrop-blur-md z-10">
          <h1 className="text-sm font-medium tracking-[0.2em] text-slate-400 uppercase">
            The Legominist Explorer
          </h1>
        </header>

        <section className="flex-1 overflow-y-auto p-8">
          {children}
        </section>
      </main>
    </div>
  );
};

export default Layout;
