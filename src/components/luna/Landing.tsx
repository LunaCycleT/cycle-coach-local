
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
      title: "Know Your Rhythms",
      description: "Track your cycle and sleep, and see your current phase with daily insights",
      color: "text-purple-600"
    },
    {
      icon: Sparkles,
      title: "See Time Your Way",
      description: "View your calendar in Gregorian, International Fixed, Ethiopian or March-First, with moon phases and Igbo market days",
      color: "text-pink-600"
    },
    {
      icon: MessageCircle,
      title: "Ask Ordiva",
      description: "An AI assistant for decisions, planning, goals, wellness and everyday questions",
      color: "text-indigo-600"
    }
  ];

  const testimonials = [
    {
      text: "Your cycle, sleep and preferences are tied to your own account and visible only to you.",
      author: "Private by design"
    },
    {
      text: "Ordiva has no streaks or scores, and it doesn't nag you with notifications. You go at your own pace.",
      author: "No pressure"
    },
    {
      text: "Ordiva is free to use while it's in early access. Ask Ordiva includes 10 messages a day.",
      author: "Free early access"
    }
  ];

  const appScreenshots = [
    {
      title: "My Rhythms",
      description: "Cycle calendar, daily phase insights and sleep logging",
      emoji: "🌙"
    },
    {
      title: "My World",
      description: "A private garden space for your reflections, arriving soon",
      emoji: "🌿"
    },
    {
      title: "Ask Ordiva",
      description: "Your AI assistant for life's questions, big and small",
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
              Ordiva
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate({ to: '/auth' })}>
              Sign In
            </Button>
            <Button 
              onClick={() => navigate({ to: '/app' })}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <div className="space-y-6 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 leading-tight">
            Your life.{' '}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Your rhythms.
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Ordiva is a private personal companion. Track your cycle and sleep, view your days in the
            calendar that fits you, and talk anything through with Ask Ordiva.
          </p>
          <div className="pt-6">
            <Button 
              size="lg"
              onClick={() => navigate({ to: '/app' })}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg px-8 py-4"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            How Ordiva Works
          </h2>
          <p className="text-lg text-gray-600">
            What you can do with Ordiva today
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
                  {feature.title}
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
            Experience Ordiva
          </h2>
          <p className="text-lg text-gray-600">
            Three spaces, one companion
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
            How Ordiva Treats You
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-purple-100">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {testimonial.author}
                </h3>
                <p className="text-gray-700">
                  {testimonial.text}
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
              Make Ordiva Yours
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Create a free account and start with your rhythms today.
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
              Ordiva
            </span>
          </div>
          <p className="text-gray-600 text-sm">
            Your life. Your rhythms. Your Ordiva.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
