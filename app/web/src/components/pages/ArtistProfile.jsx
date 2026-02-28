import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, MessageCircle, Eye, UserPlus, UserMinus, DollarSign, Edit, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import { useToast } from '@/hooks/use-toast';

const ArtistProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [artist, setArtist] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = currentUser?.id === id;

  useEffect(() => {
    fetchArtistData();
  }, [id]);

  const fetchArtistData = async () => {
    try {
      setLoading(true);
      
      // Fetch artist profile
      const artistData = await pb.collection('users').getOne(id, { $autoCancel: false });
      setArtist(artistData);

      // Fetch artworks
      const artworksData = await pb.collection('artworks').getFullList({
        filter: `creator_id = "${id}"`,
        sort: '-created',
        $autoCancel: false,
      });
      setArtworks(artworksData);

      // Fetch followers
      if (isAuthenticated) {
        const followersData = await pb.collection('followers').getFullList({
          filter: `following_id = "${id}"`,
          $autoCancel: false,
        });
        setFollowers(followersData);

        // Check if current user is following
        const isFollowingCheck = followersData.some(f => f.follower_id === currentUser?.id);
        setIsFollowing(isFollowingCheck);

        // Fetch following
        const followingData = await pb.collection('followers').getFullList({
          filter: `follower_id = "${id}"`,
          $autoCancel: false,
        });
        setFollowing(followingData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching artist data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load artist profile',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      if (isFollowing) {
        // Unfollow
        const followRecord = followers.find(f => f.follower_id === currentUser.id);
        if (followRecord) {
          await pb.collection('followers').delete(followRecord.id, { $autoCancel: false });
          setIsFollowing(false);
          toast({
            title: 'Unfollowed',
            description: `You unfollowed ${artist.username}`,
          });
        }
      } else {
        // Follow
        await pb.collection('followers').create({
          follower_id: currentUser.id,
          following_id: id,
        }, { $autoCancel: false });
        setIsFollowing(true);
        toast({
          title: 'Following',
          description: `You are now following ${artist.username}`,
        });
      }
      fetchArtistData();
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: 'Error',
        description: 'Failed to update follow status',
        variant: 'destructive',
      });
    }
  };

  const handleDonate = () => {
    toast({
      title: '🚧 Feature Coming Soon',
      description: 'Donation feature will be available soon!',
    });
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading profile...</p>
          </div>
        </div>
      </>
    );
  }

  if (!artist) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <p className="text-gray-400">Artist not found</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${artist.username} - AnimeSense`}</title>
        <meta name="description" content={artist.bio || `View ${artist.username}'s portfolio and artworks on AnimeSense`} />
      </Helmet>

      <div className="min-h-screen bg-gray-950">
        <Header />

        {/* Profile Header */}
        <div className="bg-gradient-to-b from-gray-900 to-gray-950 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
              <Avatar className="w-32 h-32 border-4 border-cyan-500">
                <AvatarImage 
                  src={artist.profile_picture ? pb.files.getUrl(artist, artist.profile_picture) : null} 
                  alt={artist.username} 
                />
                <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-pink-500 text-white text-4xl">
                  {artist.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  <h1 className="text-4xl font-bold text-white">{artist.username}</h1>
                  {artist.skill_level && (
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                      {artist.skill_level}
                    </Badge>
                  )}
                </div>

                {artist.bio && (
                  <p className="text-gray-400 mb-6 max-w-2xl">{artist.bio}</p>
                )}

                <div className="flex items-center space-x-8 mb-6">
                  <div>
                    <p className="text-2xl font-bold text-white">{artworks.length}</p>
                    <p className="text-sm text-gray-400">Artworks</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{artist.follower_count || 0}</p>
                    <p className="text-sm text-gray-400">Followers</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{artist.following_count || 0}</p>
                    <p className="text-sm text-gray-400">Following</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {isOwnProfile ? (
                    <Button 
                      onClick={() => navigate('/settings')}
                      className="bg-gray-800 hover:bg-gray-700 text-white"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button 
                        onClick={handleFollow}
                        className={isFollowing 
                          ? "bg-gray-800 hover:bg-gray-700 text-white" 
                          : "bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white"
                        }
                      >
                        {isFollowing ? (
                          <>
                            <UserMinus className="w-4 h-4 mr-2" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Follow
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={handleDonate}
                        variant="outline"
                        className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Support
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Tabs defaultValue="artworks" className="w-full">
            <TabsList className="bg-gray-900 border-gray-800 mb-8">
              <TabsTrigger value="artworks" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                Artworks
              </TabsTrigger>
              <TabsTrigger value="badges" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                Badges
              </TabsTrigger>
            </TabsList>

            <TabsContent value="artworks">
              {artworks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {artworks.map((artwork) => (
                    <motion.div
                      key={artwork.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -8 }}
                      className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-cyan-500/50 transition-all cursor-pointer"
                      onClick={() => navigate(`/artwork/${artwork.id}`)}
                    >
                      {artwork.image && (
                        <div className="aspect-square bg-gray-800">
                          <img
                            src={pb.files.getUrl(artwork, artwork.image)}
                            alt={artwork.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-white mb-2">{artwork.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="flex items-center">
                            <Heart className="w-4 h-4 mr-1" />
                            {artwork.likes_count || 0}
                          </span>
                          <span className="flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            {artwork.comments_count || 0}
                          </span>
                          <span className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            {artwork.views || 0}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400">No artworks yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="badges">
              <div className="text-center py-12">
                <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Badges feature coming soon!</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default ArtistProfile;