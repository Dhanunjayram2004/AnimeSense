import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Image, Users, Heart, Bell, Palette, BookImage, Maximize2 } from 'lucide-react';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';

const UserDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    artworks: 0,
    followers: 0,
    following: 0,
    totalLikes: 0,
  });
  const [recentArtworks, setRecentArtworks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  const fetchDashboardData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // Fetch artworks
      const artworks = await pb.collection('artworks').getFullList({
        filter: `creator_id = "${currentUser.id}"`,
        sort: '-created',
        $autoCancel: false,
      });

      // Fetch followers
      const followers = await pb.collection('followers').getFullList({
        filter: `following_id = "${currentUser.id}"`,
        $autoCancel: false,
      });

      // Fetch following
      const following = await pb.collection('followers').getFullList({
        filter: `follower_id = "${currentUser.id}"`,
        $autoCancel: false,
      });

      // Fetch notifications
      const notifs = await pb.collection('notifications').getFullList({
        filter: `user_id = "${currentUser.id}"`,
        sort: '-created',
        limit: 5,
        $autoCancel: false,
      });

      // Calculate total likes
      const totalLikes = artworks.reduce((sum, artwork) => sum + (artwork.likes_count || 0), 0);

      setStats({
        artworks: artworks.length,
        followers: followers.length,
        following: following.length,
        totalLikes,
      });

      setRecentArtworks(artworks.slice(0, 6));
      setNotifications(notifs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard - AnimeSense</title>
        <meta name="description" content="Your AnimeSense dashboard - manage your artworks, followers, and creative journey" />
      </Helmet>

      <div className="min-h-screen bg-gray-950">
        <Header />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Welcome Section */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome back, {currentUser?.username}!
            </h1>
            <p className="text-gray-400">Here&apos;s what&apos;s happening with your creative journey</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Total Artworks</p>
                      <p className="text-3xl font-bold text-white">{stats.artworks}</p>
                    </div>
                    <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                      <Image className="w-6 h-6 text-cyan-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-pink-500/10 to-pink-500/5 border-pink-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Followers</p>
                      <p className="text-3xl font-bold text-white">{stats.followers}</p>
                    </div>
                    <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-pink-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Following</p>
                      <p className="text-3xl font-bold text-white">{stats.following}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Total Likes</p>
                      <p className="text-3xl font-bold text-white">{stats.totalLikes}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <Heart className="w-6 h-6 text-red-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => navigate('/canvas')}
                  className="w-full bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white justify-start"
                >
                  <Palette className="w-5 h-5 mr-3" />
                  Create New Artwork
                </Button>
                <Button 
                  onClick={() => navigate('/canvas?focus=1')}
                  className="w-full bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 text-white justify-start"
                >
                  <Maximize2 className="w-5 h-5 mr-3" />
                  Focus Mode (Artist Workspace)
                </Button>
                <Button 
                  onClick={() => navigate('/references')}
                  variant="outline"
                  className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 justify-start"
                >
                  <BookImage className="w-5 h-5 mr-3" />
                  Browse Reference Library
                </Button>
                <Button 
                  onClick={() => navigate('/explore')}
                  variant="outline"
                  className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 justify-start"
                >
                  <Users className="w-5 h-5 mr-3" />
                  Explore Community
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Recent Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="flex items-start space-x-3 p-3 bg-gray-800 rounded-lg">
                        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                          {notif.type}
                        </Badge>
                        <p className="text-sm text-gray-300 flex-1">{notif.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">No notifications yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Artworks */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Recent Artworks</CardTitle>
            </CardHeader>
            <CardContent>
              {recentArtworks.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {recentArtworks.map((artwork) => (
                    <motion.div
                      key={artwork.id}
                      whileHover={{ scale: 1.05 }}
                      className="aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer border border-gray-700 hover:border-cyan-500/50 transition-all"
                      onClick={() => navigate(`/artwork/${artwork.id}`)}
                    >
                      {artwork.image ? (
                        <img
                          src={pb.files.getUrl(artwork, artwork.image)}
                          alt={artwork.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-8 h-8 text-gray-600" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Image className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No artworks yet</p>
                  <Button 
                    onClick={() => navigate('/canvas')}
                    className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white"
                  >
                    Create Your First Artwork
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default UserDashboard;