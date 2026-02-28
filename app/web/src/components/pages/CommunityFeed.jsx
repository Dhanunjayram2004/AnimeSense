import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Eye, Search, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import { useToast } from '@/hooks/use-toast';

const CommunityFeed = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [artworks, setArtworks] = useState([]);
  const [trendingArtworks, setTrendingArtworks] = useState([]);
  const [featuredArtists, setFeaturedArtists] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunityData();
  }, [currentUser]);

  const fetchCommunityData = async () => {
    try {
      setLoading(true);

      // Fetch all artworks
      const allArtworks = await pb.collection('artworks').getFullList({
        sort: '-created',
        $autoCancel: false,
      });

      // Fetch trending artworks (sorted by likes)
      const trending = await pb.collection('artworks').getFullList({
        sort: '-likes_count',
        limit: 12,
        $autoCancel: false,
      });

      // Fetch featured artists (users with most artworks)
      const artists = await pb.collection('users').getFullList({
        sort: '-follower_count',
        limit: 6,
        $autoCancel: false,
      });

      setArtworks(allArtworks);
      setTrendingArtworks(trending);
      setFeaturedArtists(artists);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching community data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load community feed',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast({
        title: '🚧 Search Coming Soon',
        description: 'Advanced search functionality will be available soon!',
      });
    }
  };

  const handleLike = (artworkId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    toast({
      title: '🚧 Feature Coming Soon',
      description: 'Like functionality will be available soon!',
    });
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading community...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Community - AnimeSense</title>
        <meta name="description" content="Explore artworks from the AnimeSense community, discover trending artists, and connect with creators" />
      </Helmet>

      <div className="min-h-screen bg-gray-950">
        <Header />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">Community Feed</h1>
            <p className="text-gray-400">Discover amazing artworks from talented artists</p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search artists, artworks..."
                className="pl-12 bg-gray-900 border-gray-800 text-white placeholder-gray-500 h-12"
              />
            </div>
          </form>

          {/* Featured Artists */}
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <Users className="w-6 h-6 text-cyan-400 mr-2" />
              <h2 className="text-2xl font-bold text-white">Featured Artists</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {featuredArtists.map((artist) => (
                <motion.div
                  key={artist.id}
                  whileHover={{ y: -8 }}
                  className="text-center cursor-pointer"
                  onClick={() => navigate(`/artist/${artist.id}`)}
                >
                  <Avatar className="w-24 h-24 mx-auto mb-3 border-2 border-cyan-500">
                    <AvatarImage 
                      src={artist.profile_picture ? pb.files.getUrl(artist, artist.profile_picture) : null} 
                      alt={artist.username} 
                    />
                    <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-pink-500 text-white text-2xl">
                      {artist.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-white font-semibold mb-1">{artist.username}</p>
                  <p className="text-sm text-gray-400">{artist.follower_count || 0} followers</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="latest" className="w-full">
            <TabsList className="bg-gray-900 border-gray-800 mb-8">
              <TabsTrigger value="latest" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                Latest
              </TabsTrigger>
              <TabsTrigger value="trending" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                <TrendingUp className="w-4 h-4 mr-2" />
                Trending
              </TabsTrigger>
            </TabsList>

            <TabsContent value="latest">
              <div className="columns-2 md:columns-3 xl:columns-4 gap-4 space-y-4">
                {artworks.map((artwork) => (
                  <motion.div
                    key={artwork.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -8 }}
                    className="mb-4 break-inside-avoid bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-cyan-500/50 transition-all cursor-pointer"
                    onClick={() => navigate(`/artwork/${artwork.id}`)}
                  >
                    {artwork.image && (
                      <div className="bg-gray-800">
                        <img
                          src={pb.files.getUrl(artwork, artwork.image)}
                          alt={artwork.title}
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-white mb-2 truncate">{artwork.title}</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLike(artwork.id);
                            }}
                            className="flex items-center hover:text-red-400 transition-colors"
                          >
                            <Heart className="w-4 h-4 mr-1" />
                            {artwork.likes_count || 0}
                          </button>
                          <span className="flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            {artwork.comments_count || 0}
                          </span>
                        </div>
                        <span className="flex items-center text-sm text-gray-400">
                          <Eye className="w-4 h-4 mr-1" />
                          {artwork.views || 0}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="trending">
              <div className="columns-2 md:columns-3 xl:columns-4 gap-4 space-y-4">
                {trendingArtworks.map((artwork, index) => (
                  <motion.div
                    key={artwork.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -8 }}
                    className="mb-4 break-inside-avoid bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-cyan-500/50 transition-all cursor-pointer relative"
                    onClick={() => navigate(`/artwork/${artwork.id}`)}
                  >
                    {index < 3 && (
                      <Badge className="absolute top-3 left-3 z-10 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                        #{index + 1} Trending
                      </Badge>
                    )}
                    {artwork.image && (
                      <div className="bg-gray-800">
                        <img
                          src={pb.files.getUrl(artwork, artwork.image)}
                          alt={artwork.title}
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-white mb-2 truncate">{artwork.title}</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="flex items-center text-red-400">
                            <Heart className="w-4 h-4 mr-1 fill-red-400" />
                            {artwork.likes_count || 0}
                          </span>
                          <span className="flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            {artwork.comments_count || 0}
                          </span>
                        </div>
                        <span className="flex items-center text-sm text-gray-400">
                          <Eye className="w-4 h-4 mr-1" />
                          {artwork.views || 0}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default CommunityFeed;