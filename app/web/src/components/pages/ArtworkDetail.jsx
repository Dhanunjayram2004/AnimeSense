import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, DollarSign, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import { useToast } from '@/hooks/use-toast';

const ArtworkDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [artwork, setArtwork] = useState(null);
  const [artist, setArtist] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtworkData();
    incrementViews();
  }, [id]);

  const fetchArtworkData = async () => {
    try {
      setLoading(true);

      // Fetch artwork
      const artworkData = await pb.collection('artworks').getOne(id, { $autoCancel: false });
      setArtwork(artworkData);

      // Fetch artist
      const artistData = await pb.collection('users').getOne(artworkData.creator_id, { $autoCancel: false });
      setArtist(artistData);

      // Fetch comments
      const commentsData = await pb.collection('comments').getFullList({
        filter: `artwork_id = "${id}"`,
        sort: '-created',
        $autoCancel: false,
      });
      setComments(commentsData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching artwork:', error);
      toast({
        title: 'Error',
        description: 'Failed to load artwork',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const incrementViews = async () => {
    try {
      const artworkData = await pb.collection('artworks').getOne(id, { $autoCancel: false });
      await pb.collection('artworks').update(id, {
        views: (artworkData.views || 0) + 1,
      }, { $autoCancel: false });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  const handleLike = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    toast({
      title: '🚧 Feature Coming Soon',
      description: 'Like functionality will be available soon!',
    });
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link Copied',
      description: 'Artwork link copied to clipboard!',
    });
  };

  const handleDonate = () => {
    toast({
      title: '🚧 Feature Coming Soon',
      description: 'Donation feature will be available soon!',
    });
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a comment',
        variant: 'destructive',
      });
      return;
    }

    try {
      await pb.collection('comments').create({
        content: newComment,
        artwork_id: id,
        user_id: currentUser.id,
      }, { $autoCancel: false });

      toast({
        title: 'Success',
        description: 'Comment posted successfully!',
      });

      setNewComment('');
      fetchArtworkData();
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading artwork...</p>
          </div>
        </div>
      </>
    );
  }

  if (!artwork || !artist) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <p className="text-gray-400">Artwork not found</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${artwork.title} by ${artist.username} - AnimeSense`}</title>
        <meta name="description" content={artwork.description || `View ${artwork.title} by ${artist.username} on AnimeSense`} />
      </Helmet>

      <div className="min-h-screen bg-gray-950">
        <Header />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Artwork Display */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800"
              >
                {artwork.image && (
                  <img
                    src={pb.files.getUrl(artwork, artwork.image)}
                    alt={artwork.title}
                    className="w-full h-auto"
                  />
                )}
              </motion.div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={handleLike}
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    {artwork.likes_count || 0}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    {comments.length}
                  </Button>
                </div>

                <div className="flex items-center space-x-3">
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    Share
                  </Button>
                  <Button
                    onClick={handleDonate}
                    className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white"
                  >
                    <DollarSign className="w-5 h-5 mr-2" />
                    Support
                  </Button>
                </div>
              </div>

              {/* Comments Section */}
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-white mb-6">Comments ({comments.length})</h2>

                {/* Comment Form */}
                {isAuthenticated && (
                  <form onSubmit={handleCommentSubmit} className="mb-8">
                    <div className="flex space-x-3">
                      <Avatar className="w-10 h-10 border-2 border-cyan-500">
                        <AvatarImage 
                          src={currentUser?.profile_picture ? pb.files.getUrl(currentUser, currentUser.profile_picture) : null} 
                          alt={currentUser?.username} 
                        />
                        <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-pink-500 text-white">
                          {currentUser?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex space-x-2">
                        <Input
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          className="bg-gray-900 border-gray-800 text-white placeholder-gray-500"
                        />
                        <Button 
                          type="submit"
                          className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Comments List */}
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <Avatar className="w-10 h-10 border-2 border-gray-700">
                        <AvatarFallback className="bg-gray-800 text-white">
                          U
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 bg-gray-900 rounded-lg p-4 border border-gray-800">
                        <p className="text-sm text-gray-400 mb-2">
                          {new Date(comment.created).toLocaleDateString()}
                        </p>
                        <p className="text-white">{comment.content}</p>
                      </div>
                    </div>
                  ))}

                  {comments.length === 0 && (
                    <p className="text-center text-gray-400 py-8">No comments yet. Be the first to comment!</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Artwork Info */}
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h1 className="text-3xl font-bold text-white mb-4">{artwork.title}</h1>
                {artwork.description && (
                  <p className="text-gray-400 mb-6">{artwork.description}</p>
                )}

                {/* Artist Info */}
                <div 
                  className="flex items-center space-x-3 p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors"
                  onClick={() => navigate(`/artist/${artist.id}`)}
                >
                  <Avatar className="w-12 h-12 border-2 border-cyan-500">
                    <AvatarImage 
                      src={artist.profile_picture ? pb.files.getUrl(artist, artist.profile_picture) : null} 
                      alt={artist.username} 
                    />
                    <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-pink-500 text-white">
                      {artist.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-semibold">{artist.username}</p>
                    <p className="text-sm text-gray-400">{artist.follower_count || 0} followers</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Views</span>
                    <span className="text-white font-semibold">{artwork.views || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Likes</span>
                    <span className="text-white font-semibold">{artwork.likes_count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Comments</span>
                    <span className="text-white font-semibold">{comments.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Posted</span>
                    <span className="text-white font-semibold">
                      {new Date(artwork.created).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ArtworkDetail;