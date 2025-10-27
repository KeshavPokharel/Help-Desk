import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Headphones, 
  MessageSquare, 
  Clock, 
  Shield, 
  Star, 
  ArrowRight,
  CheckCircle,
  Users,
  Zap,
  Heart,
  Quote,
  Award,
  Coffee,
  Smile,
  ThumbsUp
} from 'lucide-react';

const Landing = () => {
  const features = [
    {
      icon: <MessageSquare className="h-8 w-8 text-blue-600" />,
      title: "Chat Like Humans Do",
      description: "Have real conversations with our support team. No robots, no scripts - just genuine help when you need it most."
    },
    {
      icon: <Coffee className="h-8 w-8 text-amber-600" />,
      title: "Always Here for You",
      description: "Whether it's 3 AM or Sunday afternoon, our caring team is ready to help. Because problems don't wait for business hours."
    },
    {
      icon: <Shield className="h-8 w-8 text-emerald-600" />,
      title: "Your Privacy Matters",
      description: "We protect your information like it's our own family's. Every conversation stays confidential and secure."
    },
    {
      icon: <Smile className="h-8 w-8 text-rose-600" />,
      title: "Made with Love",
      description: "Every feature is crafted with care, tested by real people, and designed to make your life easier."
    }
  ];

  const stats = [
    { number: "10K+", label: "People We've Helped", icon: <Users className="h-6 w-6" /> },
    { number: "99.9%", label: "Always Available", icon: <CheckCircle className="h-6 w-6" /> },
    { number: "< 2hrs", label: "Response Time", icon: <Clock className="h-6 w-6" /> },
    { number: "4.9/5", label: "Satisfaction Score", icon: <Star className="h-6 w-6" /> }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Small Business Owner",
      avatar: "SC",
      quote: "The team here actually listens. When I had an urgent issue at midnight, they didn't just give me a template response - they stayed with me until it was fixed.",
      rating: 5
    },
    {
      name: "Marcus Johnson",
      role: "Freelance Designer",
      avatar: "MJ",
      quote: "Finally, a support system that treats you like a person, not a ticket number. They remembered my previous issues and followed up to make sure everything was working perfectly.",
      rating: 5
    },
    {
      name: "Elena Rodriguez",
      role: "Marketing Manager",
      avatar: "ER",
      quote: "I've used many help desk systems, but this one feels different. The team is genuinely friendly, and they explain solutions in a way that actually makes sense.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-rose-50">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-rose-500 p-2 rounded-xl shadow-lg">
                <Headphones className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-rose-600 bg-clip-text text-transparent">
                  HelpDesk
                </span>
                <div className="text-xs text-gray-500 font-medium">Human Support</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-blue-50"
              >
                Welcome Back
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-500 to-rose-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-rose-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Join Us Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Trust badge */}
            <div className="inline-flex items-center space-x-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 mb-8 shadow-sm">
              <Award className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-gray-700">Trusted by 10,000+ happy customers</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              <span className="block">Support That Actually</span>
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-rose-600 bg-clip-text text-transparent">
                Cares About You
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Skip the frustrating phone trees and chatbots. Get real help from real people who actually want to solve your problems. 
              <span className="text-gray-800 font-medium"> Because you deserve better support.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                to="/register"
                className="group bg-gradient-to-r from-blue-600 to-rose-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:from-blue-700 hover:to-rose-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center"
              >
                Start Your Free Journey
                <Heart className="ml-2 h-5 w-5 group-hover:animate-pulse" />
              </Link>
              <Link
                to="/login"
                className="border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-2xl text-lg font-semibold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center backdrop-blur-sm bg-white/70"
              >
                Welcome Back
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center text-blue-600 mb-2">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.number}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-96 h-96 bg-gradient-to-r from-blue-400 to-rose-400 rounded-full blur-3xl opacity-15 animate-pulse"></div>
        </div>
        <div className="absolute bottom-0 right-1/4 transform translate-x-1/2 translate-y-1/2">
          <div className="w-80 h-80 bg-gradient-to-r from-purple-400 to-amber-400 rounded-full blur-3xl opacity-15 animate-pulse delay-1000"></div>
        </div>
        <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
          <div className="w-64 h-64 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full blur-3xl opacity-10 animate-pulse delay-500"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <ThumbsUp className="h-4 w-4" />
              <span>What makes us different</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              Support Built by Humans,
              <br />
              <span className="text-blue-600">For Humans</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We believe technology should bring people together, not create barriers. 
              Every interaction is designed to feel personal, caring, and genuinely helpful.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-white rounded-3xl hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-gray-200 relative overflow-hidden"
              >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-rose-100 rounded-full transform translate-x-16 -translate-y-16 group-hover:scale-125 transition-transform duration-700 opacity-30"></div>
                
                <div className="relative z-10">
                  <div className="mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-rose-100 text-rose-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Quote className="h-4 w-4" />
              <span>Real stories from real people</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Community Says
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Don't just take our word for it. Here's what people who actually use our platform have to say.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 relative"
              >
                {/* Quote icon */}
                <div className="absolute top-6 right-6 text-gray-200">
                  <Quote className="h-8 w-8" />
                </div>
                
                {/* Rating */}
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-amber-400 fill-current" />
                  ))}
                </div>
                
                {/* Quote */}
                <p className="text-gray-700 mb-6 leading-relaxed italic">
                  "{testimonial.quote}"
                </p>
                
                {/* Author */}
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-rose-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-gray-500 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-rose-600 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full opacity-10 transform -translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full opacity-5 transform translate-x-48 translate-y-48"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <Heart className="h-10 w-10 text-white" />
            </div>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to Experience 
            <br />
            <span className="text-yellow-300">Human-First Support?</span>
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join our community of people who believe support should be personal, caring, and actually helpful. 
            <span className="text-white font-medium">Your first month is completely free.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              to="/register"
              className="group bg-white text-blue-600 px-10 py-5 rounded-2xl text-xl font-bold hover:bg-yellow-50 hover:text-blue-700 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 flex items-center justify-center min-w-[280px]"
            >
              Start Your Free Month
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <div className="flex items-center text-white/80 text-sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              No credit card required
            </div>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-white/70">
            <div className="flex items-center text-sm">
              <Shield className="h-4 w-4 mr-2" />
              SSL Secured
            </div>
            <div className="flex items-center text-sm">
              <Users className="h-4 w-4 mr-2" />
              10,000+ Happy Users
            </div>
            <div className="flex items-center text-sm">
              <Award className="h-4 w-4 mr-2" />
              99.9% Uptime
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-rose-500 p-3 rounded-xl shadow-lg">
                  <Headphones className="h-8 w-8 text-white" />
                </div>
                <div>
                  <span className="text-2xl font-bold">HelpDesk</span>
                  <div className="text-sm text-gray-400 font-medium">Human Support</div>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed mb-6 max-w-md">
                We're real people who genuinely care about helping you solve problems. 
                Because great support shouldn't feel robotic.
              </p>
              <div className="flex items-center text-gray-400 text-sm">
                <Heart className="h-4 w-4 mr-2 text-rose-400" />
                Made with love by humans
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="md:col-span-1">
              <h3 className="text-lg font-semibold mb-6 text-white">Our Community</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-300">Happy Customers</span>
                  <span className="font-bold text-blue-400">10,000+</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-300">Average Response</span>
                  <span className="font-bold text-emerald-400">&lt; 2 hours</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-300">Satisfaction Rate</span>
                  <span className="font-bold text-amber-400">4.9/5 ⭐</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-300">Always Available</span>
                  <span className="font-bold text-rose-400">24/7</span>
                </div>
              </div>
            </div>
            
            {/* Contact */}
            <div className="md:col-span-1">
              <h3 className="text-lg font-semibold mb-6 text-white">Get Started</h3>
              <div className="space-y-4">
                <Link
                  to="/register"
                  className="block bg-gradient-to-r from-blue-600 to-rose-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-rose-700 transition-all duration-200 text-center"
                >
                  Join Free Today
                </Link>
                <Link
                  to="/login"
                  className="block border border-gray-600 text-gray-300 px-6 py-3 rounded-xl font-semibold hover:border-gray-500 hover:text-white transition-all duration-200 text-center"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 HelpDesk. Built by humans, for humans. All rights reserved.
            </div>
            <div className="flex items-center space-x-4 text-gray-400 text-sm">
              <span className="flex items-center">
                <Shield className="h-4 w-4 mr-1" />
                Privacy Protected
              </span>
              <span className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                GDPR Compliant
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;