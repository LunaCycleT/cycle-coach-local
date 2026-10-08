
import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Moon, Calendar, Sparkles, MessageCircle, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Calendar,
      title: "Track Your Cycle",
      description: "Log your period and see your current cycle phase with personalized insights",
      color: "text-purple-600"
    },
    {
      icon: Sparkles,
      title: "Get Daily Insights",
      description: "Receive AI-powered tips tailored to your cycle phase for optimal wellness",
      color: "text-pink-600"
    },
    {
      icon: MessageCircle,
      title: "Chat with Luna AI",
      description: "Ask questions about your cycle, wellness, and get personalized coaching",
      color: "text-indigo-600"
    }
  ];

  const testimonials = [
    {
      text: "Really slick interface—love the clarity and vibe.",
      author: "Sarah M."
    },
    {
      text: "I wasn't expecting a wellness app this smart.",
      author: "Jennifer K."
    },
    {
      text: "Finally, an app that understands women in leadership.",
      author: "Maria L."
    }
  ];

  const appScreenshots = [
    {
      title: "Cycle Tracking",
      description: "Beautiful calendar view with phase insights",
      emoji: "📅"
    },
    {
      title: "AI Insights",
      description: "Personalized daily tips and recommendations",
      emoji: "💡"
    },
    {
      title: "Chat Coach",
      description: "24/7 AI coach for all your wellness questions",
      emoji: "💬"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-purple-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Moon className="w-6 h-6 text-purple-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Luna
            </span>
          </div>
          <Button 
            onClick={() => navigate({ to: '/app' })}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <div className="space-y-6 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 leading-tight">
            Luna: Sync Focus, Confidence, and{' '}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Clarity
            </span>{' '}
            with Your Cycle
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            AI-powered wellness for women in leadership. Track your cycle, get personalized insights, 
            and unlock your peak performance every day.
          </p>
          <div className="pt-6">
            <Button 
              size="lg"
              onClick={() => navigate({ to: '/app' })}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg px-8 py-4"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            How Luna Works
          </h2>
          <p className="text-lg text-gray-600">
            Three simple steps to optimize your wellness journey
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center border-purple-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-white shadow-sm flex items-center justify-center ${feature.color}`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {index + 1}. {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* App Preview Section */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Experience Luna
          </h2>
          <p className="text-lg text-gray-600">
            See how Luna transforms your wellness routine
          </p>
        </div>

        <Carousel className="w-full max-w-4xl mx-auto">
          <CarouselContent>
            {appScreenshots.map((screenshot, index) => (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                <Card className="border-purple-100">
                  <CardContent className="p-6 text-center">
                    <div className="text-6xl mb-4">{screenshot.emoji}</div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                      {screenshot.title}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {screenshot.description}
                    </p>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </section>

      {/* Testimonials Section */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            What Early Users Say
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-purple-100">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "{testimonial.text}"
                </p>
                <p className="text-sm text-gray-500 font-medium">
                  — {testimonial.author}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <Card className="bg-gradient-to-r from-purple-500 to-pink-500 border-0">
          <CardContent className="p-12 text-center text-white">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Lead in Sync?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of women who've transformed their wellness with Luna's AI-powered insights.
            </p>
            <Button 
              size="lg"
              onClick={() => navigate({ to: '/app' })}
              className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-4"
            >
              Log In / Create Account
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-purple-100 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Moon className="w-6 h-6 text-purple-600" />
            <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Luna
            </span>
          </div>
          <p className="text-gray-600 text-sm">
            Your personal cycle companion for optimal wellness and performance.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
