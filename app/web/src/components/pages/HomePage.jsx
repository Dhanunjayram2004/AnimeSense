import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Palette, BookImage, Users, Sparkles, TrendingUp, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: BookImage,
      title: 'Reference Library',
      description: 'Build your personal collection of reference images for anatomy, poses, and more',
      color: 'from-cyan-500 to-blue-500',
    },
    {
      icon: Palette,
      title: 'Digital Canvas',
      description: 'Professional drawing tools with layers, brushes, and real-time collaboration',
      color: 'from-pink-500 to-purple-500',
    },
    {
      icon: Users,
      title: 'Creative Community',
      description: 'Connect with artists, share your work, and get feedback from the community',
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <>
      <Helmet>
        <title>AnimeSense - Creative Platform for Anime & Manga Artists</title>
        <meta name="description" content="Join AnimeSense - The ultimate creative platform for anime and manga artists. Access reference libraries, digital canvas, and connect with a vibrant community." />
      </Helmet>

      <div className="min-h-screen bg-gray-950">
        <Header />

        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-gray-950 to-pink-900/20"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="text-5xl lg:text-7xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                    Unleash Your
                  </span>
                  <br />
                  <span className="text-white">Creative Vision</span>
                </h1>
                <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                  The ultimate platform for anime and manga artists. Build your reference library, 
                  create stunning artwork, and connect with a passionate community of creators.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
                    size="lg"
                    className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white text-lg px-8 py-6"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    {isAuthenticated ? 'Go to Dashboard' : 'Join AnimeSense'}
                  </Button>
                  <Button 
                    onClick={() => navigate('/community')}
                    size="lg"
                    variant="outline"
                    className="border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 text-lg px-8 py-6"
                  >
                    Explore Community
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="aspect-video rounded-2xl overflow-hidden border-4 border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
                  <img
                    src="https://images.unsplash.com/photo-1688107389732-b88fcd73c02e"
                    alt="Anime and manga creative workspace with digital art tools"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute -top-6 -left-6 w-32 h-32 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full blur-3xl opacity-50"></div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-gradient-to-b from-gray-950 to-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                Everything You Need to Create
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Powerful tools and features designed specifically for anime and manga artists
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  whileHover={{ y: -8 }}
                >
                  <Card className="bg-gray-900/50 border-gray-800 hover:border-cyan-500/50 transition-all h-full">
                    <CardContent className="p-8">
                      <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                        <feature.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                      <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: 'Active Artists', value: '10K+', icon: Users },
                { label: 'Artworks Created', value: '50K+', icon: Palette },
                { label: 'References Shared', value: '100K+', icon: BookImage },
                { label: 'Community Engagement', value: '95%', icon: TrendingUp },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-4xl font-bold text-white mb-2">{stat.value}</p>
                  <p className="text-gray-400">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Award className="w-20 h-20 text-cyan-400 mx-auto mb-6" />
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                Ready to Start Your Creative Journey?
              </h2>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Join thousands of artists who are already creating amazing artwork on AnimeSense
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => navigate(isAuthenticated ? '/canvas' : '/signup')}
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white text-lg px-8 py-6"
                >
                  {isAuthenticated ? 'Start Creating' : 'Sign Up Free'}
                </Button>
                {!isAuthenticated && (
                  <Button 
                    onClick={() => navigate('/login')}
                    size="lg"
                    variant="outline"
                    className="border-2 border-gray-700 text-gray-300 hover:bg-gray-800 text-lg px-8 py-6"
                  >
                    Already have an account?
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-950 border-t border-gray-800 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Palette className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
                  AnimeSense
                </span>
              </div>
              <p className="text-gray-400 text-center md:text-left">
                © 2026 AnimeSense. Empowering artists worldwide.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default HomePage;