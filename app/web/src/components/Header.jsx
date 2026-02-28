import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Search, Menu, X, User, LogOut, Settings, LayoutDashboard, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import pb from '@/lib/pocketbaseClient';

const Header = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const getAvatarUrl = () => {
    if (currentUser?.profile_picture) {
      return pb.files.getUrl(currentUser, currentUser.profile_picture);
    }
    return null;
  };

  return (
    <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-md border-b border-cyan-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-pink-500 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
              AnimeSense
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-300 hover:text-cyan-400 transition-colors">
              Home
            </Link>
            <Link to="/explore" className="text-gray-300 hover:text-cyan-400 transition-colors">
              Explore
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/canvas" className="text-gray-300 hover:text-cyan-400 transition-colors">
                  Canvas
                </Link>
                <Link to="/community" className="text-gray-300 hover:text-cyan-400 transition-colors">
                  Community
                </Link>
              </>
            )}
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search artists, artworks..."
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </form>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-cyan-500">
                      <AvatarImage src={getAvatarUrl()} alt={currentUser?.username} />
                      <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-pink-500 text-white">
                        {currentUser?.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-800">
                  <div className="px-2 py-2">
                    <p className="text-sm font-medium text-white">{currentUser?.username}</p>
                    <p className="text-xs text-gray-400">{currentUser?.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-gray-800" />
                  <DropdownMenuItem 
                    onClick={() => navigate(`/artist/${currentUser?.id}`)}
                    className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate('/dashboard')}
                    className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate('/settings')}
                    className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-800" />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-red-400 hover:text-red-300 hover:bg-gray-800 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/login')}
                  className="text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  Login
                </Button>
                <Button 
                  onClick={() => navigate('/signup')}
                  className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white"
                >
                  Sign Up
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <nav className="flex flex-col space-y-4">
              <Link to="/" className="text-gray-300 hover:text-cyan-400 transition-colors">
                Home
              </Link>
              <Link to="/explore" className="text-gray-300 hover:text-cyan-400 transition-colors">
                Explore
              </Link>
              {isAuthenticated && (
                <>
                  <Link to="/canvas" className="text-gray-300 hover:text-cyan-400 transition-colors">
                    Canvas
                  </Link>
                  <Link to="/community" className="text-gray-300 hover:text-cyan-400 transition-colors">
                    Community
                  </Link>
                </>
              )}
              {!isAuthenticated && (
                <div className="flex flex-col space-y-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/login')}
                    className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Login
                  </Button>
                  <Button 
                    onClick={() => navigate('/signup')}
                    className="w-full bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;