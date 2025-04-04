"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { ExternalLink, FileText, Github, MessageSquare } from "lucide-react"

export default function LandingPage() {
  const router = useRouter()
  const [currentBanner, setCurrentBanner] = useState(0)

  // Anime-themed banner images (would be replaced with actual anime images)
  const banners = [
    {
      title: "API Control Interface",
      description: "Manage your anime data with our powerful API",
      image: "/placeholder.svg?height=600&width=1200&text=Anime+API+Banner+1",
    },
    {
      title: "Real-time Chat",
      description: "Connect with fellow anime enthusiasts",
      image: "/placeholder.svg?height=600&width=1200&text=Anime+Chat+Banner+2",
    },
    {
      title: "Comprehensive Documentation",
      description: "Everything you need to get started",
      image: "/placeholder.svg?height=600&width=1200&text=Anime+Docs+Banner+3",
    },
  ]

  // Auto-rotate banners
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [banners.length])

  // Anime character mascots
  const mascots = [
    {
      name: "API-chan",
      role: "API Documentation",
      description: "Your guide to all API endpoints and features",
      image: "/placeholder.svg?height=300&width=300&text=API-chan",
    },
    {
      name: "Socket-kun",
      role: "Real-time Features",
      description: "Helps you implement real-time communication",
      image: "/placeholder.svg?height=300&width=300&text=Socket-kun",
    },
    {
      name: "Docu-san",
      role: "Project Documentation",
      description: "Explains project architecture and setup",
      image: "/placeholder.svg?height=300&width=300&text=Docu-san",
    },
  ]

  return (
    <main className="min-h-screen bg-gray-950 text-gray-200 overflow-x-hidden">
      {/* Navigation */}
      <nav className="border-b border-purple-900/50 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="text-xl font-bold text-white">AnimeAPI</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link href="#features" className="text-gray-300 hover:text-purple-400 transition-colors">
              Features
            </Link>
            <Link href="#docs" className="text-gray-300 hover:text-purple-400 transition-colors">
              Documentation
            </Link>
            <Link href="#mascots" className="text-gray-300 hover:text-purple-400 transition-colors">
              Mascots
            </Link>
            <Link href="/chat" className="text-gray-300 hover:text-purple-400 transition-colors">
              Chat
            </Link>
            <Button
              onClick={() => router.push("/auth")}
              variant="outline"
              className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
            >
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Banner with Anime Theme */}
      <section className="relative h-[70vh] overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-purple-900 opacity-80"></div>

        {/* Banner images */}
        <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out">
          <Image
            src={banners[currentBanner].image || "/placeholder.svg"}
            alt={banners[currentBanner].title}
            fill
            className="object-cover opacity-40"
          />
        </div>

        {/* Floating anime elements */}
        <div className="absolute top-20 right-20 animate-float-slow opacity-30">
          <div className="w-32 h-32 rounded-full bg-pink-500/20 backdrop-blur-md"></div>
        </div>
        <div className="absolute bottom-20 left-20 animate-float-medium opacity-30">
          <div className="w-24 h-24 rounded-full bg-purple-500/20 backdrop-blur-md"></div>
        </div>

        {/* Content */}
        <div className="relative h-full container mx-auto flex flex-col justify-center items-center text-center px-4">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fade-in">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              {banners[currentBanner].title}
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mb-8 animate-fade-in-delay">
            {banners[currentBanner].description}
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 animate-fade-in-delay-long">
            <Button
              onClick={() => router.push("/auth")}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white border-0"
            >
              Get Started
            </Button>
            <Button
              onClick={() => router.push("#docs")}
              size="lg"
              variant="outline"
              className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
            >
              View Documentation
            </Button>
          </div>
        </div>

        {/* Banner indicators */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-colors ${
                currentBanner === index ? "bg-purple-500" : "bg-gray-600"
              }`}
              onClick={() => setCurrentBanner(index)}
            />
          ))}
        </div>
      </section>

      {/* Features Section with Anime Style */}
      <section id="features" className="py-20 px-4 relative overflow-hidden">
        {/* Anime-style decorative elements */}
        <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-purple-900/20 to-transparent"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl"></div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4 inline-block relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                Key Features
              </span>
              <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-600"></span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Our platform provides powerful tools for anime API control and real-time communication.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "RESTful API",
                description: "Comprehensive endpoints for managing anime data with detailed documentation.",
                icon: "🚀",
                animation: "animate-bounce-slow",
              },
              {
                title: "Real-time Socket.io",
                description: "Implement real-time features with our Socket.io integration for live updates.",
                icon: "⚡",
                animation: "animate-pulse-slow",
              },
              {
                title: "Authentication",
                description: "Secure your API with our robust authentication system and user management.",
                icon: "🔒",
                animation: "animate-float-slow",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="bg-gray-800/50 backdrop-blur-sm border-purple-900/50 hover:border-purple-500/70 transition-all duration-300 overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="p-6 relative">
                  <div className={`text-4xl mb-4 ${feature.animation}`}>{feature.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Documentation Section */}
      <section id="docs" className="py-20 px-4 bg-gray-900/50 relative">
        {/* Anime-style decorative background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-40 w-60 h-60 rounded-full bg-purple-600/30 blur-3xl"></div>
          <div className="absolute bottom-20 left-40 w-60 h-60 rounded-full bg-pink-600/30 blur-3xl"></div>
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4 inline-block relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                Documentation & Resources
              </span>
              <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-600"></span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Everything you need to get started with our API and join our community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "API Documentation",
                description: "Comprehensive guide to all API endpoints, parameters, and responses.",
                icon: <FileText className="h-6 w-6" />,
                link: "#",
                color: "from-purple-500 to-pink-600",
              },
              {
                title: "Project Setup",
                description: "Step-by-step instructions for setting up and configuring the project.",
                icon: <Github className="h-6 w-6" />,
                link: "#",
                color: "from-blue-500 to-purple-600",
              },
              {
                title: "Discord Community",
                description: "Join our Discord server to connect with other developers and get help.",
                icon: <MessageSquare className="h-6 w-6" />,
                link: "#",
                color: "from-indigo-500 to-purple-600",
              },
              {
                title: "Socket.io Guide",
                description: "Learn how to implement real-time features with our Socket.io integration.",
                icon: <ExternalLink className="h-6 w-6" />,
                link: "#",
                color: "from-pink-500 to-purple-600",
              },
            ].map((resource, index) => (
              <a key={index} href={resource.link} className="block group">
                <Card className="h-full bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:border-purple-500/70 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className={`p-3 rounded-full bg-gradient-to-br ${resource.color} w-fit mb-4`}>
                      {resource.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                      {resource.title}
                    </h3>
                    <p className="text-gray-400 mb-4">{resource.description}</p>
                    <div className="mt-auto flex items-center text-purple-400 font-medium">
                      <span>Learn more</span>
                      <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Anime Mascots Section */}
      <section id="mascots" className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-gray-900/50 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-gray-900/50 to-transparent"></div>
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4 inline-block relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                Meet Our Mascots
              </span>
              <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-600"></span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Our anime-inspired guides to help you navigate the platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {mascots.map((mascot, index) => (
              <div key={index} className="group">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden border border-purple-900/50 group-hover:border-purple-500/70 transition-all duration-300">
                  <div className="h-64 relative overflow-hidden">
                    <Image
                      src={mascot.image || "/placeholder.svg"}
                      alt={mascot.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-70"></div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">
                      {mascot.name}
                    </h3>
                    <p className="text-purple-400 mb-3">{mascot.role}</p>
                    <p className="text-gray-400">{mascot.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Anime GIF/Video Showcase */}
      <section className="py-20 px-4 bg-gray-900/50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-40 w-60 h-60 rounded-full bg-purple-600/30 blur-3xl"></div>
          <div className="absolute bottom-20 left-40 w-60 h-60 rounded-full bg-pink-600/30 blur-3xl"></div>
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4 inline-block relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                Anime Showcase
              </span>
              <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-600"></span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Check out these awesome anime clips and GIFs that inspire our design.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="rounded-lg overflow-hidden border border-purple-900/50 hover:border-purple-500/70 transition-all duration-300 group"
              >
                <div className="aspect-video relative">
                  <Image
                    src={`/placeholder.svg?height=300&width=500&text=Anime+GIF+${item}`}
                    alt={`Anime GIF ${item}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-70 transition-opacity flex items-end justify-center pb-4">
                    <p className="text-white font-medium">Anime Scene {item}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-900 to-purple-900/70 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-gray-950 to-transparent"></div>
        </div>

        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to join our anime API community?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Get started with our powerful API and connect with fellow anime enthusiasts.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button
              onClick={() => router.push("/auth")}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
            >
              Create Account
            </Button>
            <Button
              onClick={() => router.push("/chat")}
              size="lg"
              variant="outline"
              className="border-purple-400 text-purple-400 hover:bg-purple-500 hover:text-white"
            >
              Try Chat Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-950 border-t border-purple-900/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-xs">A</span>
                </div>
                <span className="text-lg font-bold text-white">AnimeAPI</span>
              </div>
              <p className="text-gray-400">The ultimate API control interface for anime enthusiasts and developers.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-purple-400 transition-colors">
                    API Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-purple-400 transition-colors">
                    Socket.io Guide
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-purple-400 transition-colors">
                    Project Setup
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Community</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-purple-400 transition-colors">
                    Discord Server
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-purple-400 transition-colors">
                    GitHub
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-purple-400 transition-colors">
                    Twitter
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-purple-400 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-purple-400 transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-purple-400 transition-colors">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-purple-900/30 mt-12 pt-8 text-center text-gray-500">
            <p>© 2025 AnimeAPI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

