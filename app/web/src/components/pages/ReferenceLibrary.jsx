import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Search, Star, X, Image as ImageIcon, Pin, PinOff, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import { useToast } from '@/hooks/use-toast';
import { loadPinnedReferences, removePinnedReference, upsertPinnedReference } from '@/lib/pinnedReferences';

const CATEGORIES = [
  'Anatomy', 'Poses', 'Hands', 'Faces', 'Perspectives', 
  'Environments', 'Clothing', 'Lighting', 'Objects', 'Other'
];

const ReferenceLibrary = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [references, setReferences] = useState([]);
  const [filteredReferences, setFilteredReferences] = useState([]);
  const [pinned, setPinned] = useState([]);
  const [activePinnedId, setActivePinnedId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadData, setUploadData] = useState({
    image: null,
    category: '',
  });

  useEffect(() => {
    fetchReferences();
  }, [currentUser]);

  useEffect(() => {
    const pins = loadPinnedReferences();
    setPinned(pins);
    setActivePinnedId((prev) => prev ?? pins?.[0]?.id ?? null);
  }, []);

  useEffect(() => {
    filterReferences();
  }, [references, selectedCategory, searchQuery]);

  const fetchReferences = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const data = await pb.collection('references').getFullList({
        filter: `uploader_id = "${currentUser.id}"`,
        sort: '-created',
        $autoCancel: false,
      });
      setReferences(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching references:', error);
      toast({
        title: 'Error',
        description: 'Failed to load references',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const filterReferences = () => {
    let filtered = references;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(ref => ref.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(ref => 
        ref.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredReferences(filtered);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadData({ ...uploadData, image: file });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!uploadData.image || !uploadData.category) {
      toast({
        title: 'Error',
        description: 'Please select an image and category',
        variant: 'destructive',
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', uploadData.image);
      formData.append('category', uploadData.category);
      formData.append('uploader_id', currentUser.id);
      formData.append('is_favorite', false);

      await pb.collection('references').create(formData, { $autoCancel: false });

      toast({
        title: 'Success',
        description: 'Reference uploaded successfully',
      });

      setUploadDialogOpen(false);
      setUploadData({ image: null, category: '' });
      fetchReferences();
    } catch (error) {
      console.error('Error uploading reference:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload reference',
        variant: 'destructive',
      });
    }
  };

  const toggleFavorite = async (referenceId, currentFavorite) => {
    try {
      await pb.collection('references').update(referenceId, {
        is_favorite: !currentFavorite,
      }, { $autoCancel: false });
      fetchReferences();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const deleteReference = async (referenceId) => {
    if (!window.confirm('Are you sure you want to delete this reference?')) return;

    try {
      await pb.collection('references').delete(referenceId, { $autoCancel: false });
      toast({
        title: 'Deleted',
        description: 'Reference deleted successfully',
      });
      fetchReferences();
    } catch (error) {
      console.error('Error deleting reference:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete reference',
        variant: 'destructive',
      });
    }
  };

  const pinReference = (ref) => {
    const url = pb.files.getUrl(ref, ref.image);
    const nextPins = upsertPinnedReference({
      id: ref.id,
      url,
      category: ref.category ?? "Other",
      source: "references",
    });
    setPinned(nextPins);
    setActivePinnedId(ref.id);
    toast({
      title: "Pinned",
      description: "Added to your pinned manga panels for drawing.",
    });
  };

  const unpinReference = (id) => {
    const nextPins = removePinnedReference(id);
    setPinned(nextPins);
    setActivePinnedId((prev) => {
      if (prev !== id) return prev;
      return nextPins?.[0]?.id ?? null;
    });
  };

  const activePinned = pinned.find((p) => p.id === activePinnedId) ?? pinned[0] ?? null;

  return (
    <>
      <Helmet>
        <title>Reference Library - AnimeSense</title>
        <meta name="description" content="Manage your reference images for drawing inspiration and practice" />
      </Helmet>

      <div className="min-h-screen bg-gray-950">
        <Header />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Reference Library</h1>
              <p className="text-gray-400">Organize your reference images for drawing practice</p>
            </div>

            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4 md:mt-0 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Reference
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-800 text-white">
                <DialogHeader>
                  <DialogTitle>Upload Reference Image</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="image">Image</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="bg-gray-800 border-gray-700 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={uploadData.category} onValueChange={(value) => setUploadData({ ...uploadData, category: value })}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-white hover:bg-gray-700">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white">
                    Upload
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search references..."
                className="pl-10 bg-gray-900 border-gray-800 text-white placeholder-gray-500"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48 bg-gray-900 border-gray-800 text-white">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800">
                <SelectItem value="all" className="text-white hover:bg-gray-800">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-white hover:bg-gray-800">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Split View (Grid + Pinned Panels) */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: References */}
            <div className="flex-1">
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading references...</p>
                </div>
              ) : filteredReferences.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredReferences.map((ref) => {
                    const pinnedThis = pinned.some((p) => p.id === ref.id);
                    return (
                      <motion.div
                        key={ref.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative group"
                      >
                        <div className="aspect-square bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-cyan-500/50 transition-all">
                          <img
                            src={pb.files.getUrl(ref, ref.image)}
                            alt={ref.category}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => setPreviewImage(ref)}
                          />

                          {/* Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => (pinnedThis ? unpinReference(ref.id) : pinReference(ref))}
                              className="text-white hover:bg-white/20"
                            >
                              {pinnedThis ? <PinOff className="w-5 h-5" /> : <Pin className="w-5 h-5" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleFavorite(ref.id, ref.is_favorite)}
                              className="text-white hover:bg-white/20"
                            >
                              <Star className={`w-5 h-5 ${ref.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteReference(ref.id)}
                              className="text-white hover:bg-white/20"
                            >
                              <X className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>

                        <Badge className="mt-2 bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                          {ref.category}
                        </Badge>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No references found</p>
                  <Button 
                    onClick={() => setUploadDialogOpen(true)}
                    className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white"
                  >
                    Upload Your First Reference
                  </Button>
                </div>
              )}
            </div>

            {/* Right: Pinned Panels */}
            <div className="lg:w-[360px] w-full">
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-white font-semibold">Pinned Panels</h2>
                    <p className="text-gray-400 text-sm">Pin manga panels and keep them visible while you draw.</p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    onClick={() => window.location.assign("/canvas?focus=1")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Focus
                  </Button>
                </div>

                {pinned.length === 0 ? (
                  <div className="p-4">
                    <p className="text-gray-400 text-sm">
                      No pinned panels yet. Hover a reference and tap the pin icon.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 space-y-4">
                    {activePinned && (
                      <div className="rounded-lg overflow-hidden border border-gray-800">
                        <img
                          src={activePinned.url}
                          alt={activePinned.category}
                          className="w-full h-56 object-cover"
                        />
                        <div className="p-3 flex items-center justify-between">
                          <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/40">
                            {activePinned.category ?? "Pinned"}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-300 hover:bg-gray-800"
                            onClick={() => unpinReference(activePinned.id)}
                          >
                            <PinOff className="w-4 h-4 mr-2" />
                            Unpin
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {pinned.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setActivePinnedId(p.id)}
                          className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border ${
                            p.id === activePinnedId ? "border-cyan-500/70" : "border-gray-800"
                          }`}
                        >
                          <img src={p.url} alt={p.category ?? "Pinned"} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview Dialog */}
          {previewImage && (
            <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
              <DialogContent className="max-w-4xl bg-gray-900 border-gray-800">
                <img
                  src={pb.files.getUrl(previewImage, previewImage.image)}
                  alt={previewImage.category}
                  className="w-full h-auto rounded-lg"
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </>
  );
};

export default ReferenceLibrary;