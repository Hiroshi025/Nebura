"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Send, Paperclip, MoreVertical, Phone, Video } from "lucide-react"

// Mock user data with anime avatars
const currentUser = {
  id: "user1",
  name: "You",
  avatar: "/placeholder.svg?height=40&width=40&text=You",
}

const contacts = [
  {
    id: "user2",
    name: "Sakura",
    avatar: "/placeholder.svg?height=40&width=40&text=🌸",
    lastMessage: "Hey, how's it going?",
    lastMessageTime: "10:30 AM",
    online: true,
  },
  {
    id: "user3",
    name: "Naruto",
    avatar: "/placeholder.svg?height=40&width=40&text=🍥",
    lastMessage: "Believe it!",
    lastMessageTime: "Yesterday",
    online: false,
  },
  {
    id: "user4",
    name: "Goku",
    avatar: "/placeholder.svg?height=40&width=40&text=🔥",
    lastMessage: "Training right now, talk later!",
    lastMessageTime: "Yesterday",
    online: true,
  },
  {
    id: "user5",
    name: "Mikasa",
    avatar: "/placeholder.svg?height=40&width=40&text=⚔️",
    lastMessage: "We need to protect Eren",
    lastMessageTime: "Monday",
    online: false,
  },
]

// Mock message data
const initialMessages = [
  {
    id: "msg1",
    senderId: "user2",
    text: "Hey there! How are you doing?",
    timestamp: "10:30 AM",
  },
  {
    id: "msg2",
    senderId: "user1",
    text: "I'm good, thanks! Just working on the anime API.",
    timestamp: "10:32 AM",
  },
  {
    id: "msg3",
    senderId: "user2",
    text: "That sounds interesting. What kind of API is it?",
    timestamp: "10:33 AM",
  },
  {
    id: "msg4",
    senderId: "user1",
    text: "It's a RESTful API for anime data with Socket.io for real-time updates.",
    timestamp: "10:35 AM",
  },
  {
    id: "msg5",
    senderId: "user2",
    text: "Sugoi! That's exactly what I've been looking for! Can you tell me more about the endpoints?",
    timestamp: "10:36 AM",
  },
]

export default function ChatPage() {
  const [activeContact, setActiveContact] = useState(contacts[0])
  const [messages, setMessages] = useState(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const [activeTab, setActiveTab] = useState("chats")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Simulate typing indicator
  useEffect(() => {
    if (messages[messages.length - 1]?.senderId === "user1") {
      const timeout = setTimeout(() => {
        setIsTyping(true)

        // After "typing", send a response
        const responseTimeout = setTimeout(() => {
          setIsTyping(false)
          const responses = [
            "That's so cool! I love anime APIs!",
            "Can you tell me more about the Socket.io integration?",
            "Is there documentation available for the API?",
            "Sugoi! This is amazing!",
            "Nani?! That's impressive!",
          ]

          const newMsg = {
            id: `msg${messages.length + 1}`,
            senderId: activeContact.id,
            text: responses[Math.floor(Math.random() * responses.length)],
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          }

          setMessages((prev) => [...prev, newMsg])
        }, 3000)

        return () => clearTimeout(responseTimeout)
      }, 1000)

      return () => clearTimeout(timeout)
    }
  }, [messages, activeContact.id])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim()) return

    const newMsg = {
      id: `msg${messages.length + 1}`,
      senderId: currentUser.id,
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages([...messages, newMsg])
    setNewMessage("")
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-200">
      {/* Navigation */}
      <nav className="border-b border-purple-900/50 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link
              href="/"
              className="flex items-center space-x-2 text-gray-300 hover:text-purple-400 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xs">A</span>
              </div>
              <span className="text-lg font-bold text-white">AnimeAPI</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth" className="text-gray-300 hover:text-purple-400 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto py-6 px-4">
        <Card className="border-purple-900/50 bg-gray-900 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-4 h-[calc(100vh-12rem)]">
            {/* Sidebar */}
            <div className="border-r border-purple-900/50 md:col-span-1">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-800 rounded-none">
                  <TabsTrigger value="chats" className="data-[state=active]:bg-gray-700">
                    Chats
                  </TabsTrigger>
                  <TabsTrigger value="contacts" className="data-[state=active]:bg-gray-700">
                    Contacts
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="chats" className="m-0">
                  <div className="p-3">
                    <Input
                      placeholder="Search chats..."
                      className="bg-gray-800 border-gray-700 text-white focus:border-purple-500"
                    />
                  </div>
                  <div className="overflow-y-auto h-[calc(100vh-16rem)]">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`flex items-center p-3 cursor-pointer hover:bg-gray-800 transition-colors ${activeContact.id === contact.id ? "bg-gray-800" : ""}`}
                        onClick={() => setActiveContact(contact)}
                      >
                        <div className="relative">
                          <Avatar className="border-2 border-purple-500/50">
                            <AvatarImage src={contact.avatar} alt={contact.name} />
                            <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {contact.online && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></span>
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between items-center">
                            <h3 className="text-white font-medium">{contact.name}</h3>
                            <span className="text-xs text-gray-400">{contact.lastMessageTime}</span>
                          </div>
                          <p className="text-sm text-gray-400 truncate">{contact.lastMessage}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="contacts" className="m-0">
                  <div className="p-3">
                    <Input
                      placeholder="Search contacts..."
                      className="bg-gray-800 border-gray-700 text-white focus:border-purple-500"
                    />
                  </div>
                  <div className="overflow-y-auto h-[calc(100vh-16rem)]">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center p-3 cursor-pointer hover:bg-gray-800 transition-colors"
                        onClick={() => {
                          setActiveContact(contact)
                          setActiveTab("chats")
                        }}
                      >
                        <div className="relative">
                          <Avatar className="border-2 border-purple-500/50">
                            <AvatarImage src={contact.avatar} alt={contact.name} />
                            <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {contact.online && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></span>
                          )}
                        </div>
                        <div className="ml-3">
                          <h3 className="text-white font-medium">{contact.name}</h3>
                          <p className="text-sm text-gray-400">{contact.online ? "Online" : "Offline"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Chat Area */}
            <div className="md:col-span-3 flex flex-col">
              {/* Chat Header */}
              <div className="border-b border-purple-900/50 p-4 flex justify-between items-center bg-gray-900">
                <div className="flex items-center">
                  <Avatar className="border-2 border-purple-500/50">
                    <AvatarImage src={activeContact.avatar} alt={activeContact.name} />
                    <AvatarFallback>{activeContact.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <h3 className="text-white font-medium">{activeContact.name}</h3>
                    <p className="text-xs text-gray-400">{activeContact.online ? "Online" : "Offline"}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-purple-400 hover:bg-gray-800">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-purple-400 hover:bg-gray-800">
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-purple-400 hover:bg-gray-800">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-950">
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isCurrentUser = message.senderId === currentUser.id
                    return (
                      <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                        {!isCurrentUser && (
                          <Avatar className="mr-2 flex-shrink-0 border-2 border-purple-500/50">
                            <AvatarImage src={activeContact.avatar} alt={activeContact.name} />
                            <AvatarFallback>{activeContact.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`max-w-[70%] ${isCurrentUser ? "bg-purple-600" : "bg-gray-800"} rounded-lg p-3`}
                        >
                          <p className="text-white">{message.text}</p>
                          <p className="text-xs text-right mt-1 text-gray-300">{message.timestamp}</p>
                        </div>
                      </div>
                    )
                  })}
                  {isTyping && (
                    <div className="flex justify-start">
                      <Avatar className="mr-2 flex-shrink-0 border-2 border-purple-500/50">
                        <AvatarImage src={activeContact.avatar} alt={activeContact.name} />
                        <AvatarFallback>{activeContact.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-800 rounded-lg p-3 flex items-center space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        ></div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Message Input */}
              <div className="border-t border-purple-900/50 p-4 bg-gray-900">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-purple-400 hover:bg-gray-800"
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-800 border-gray-700 text-white focus:border-purple-500"
                  />
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </Card>

        {/* Socket.io Connection Info */}
        <div className="mt-6 p-4 bg-gray-900 border border-purple-900/50 rounded-lg">
          <h3 className="text-white font-medium mb-2">Socket.io Connection</h3>
          <p className="text-gray-400 text-sm">
            This is a demo interface. In a real implementation, this chat would be connected to a Socket.io backend for
            real-time messaging.
          </p>
          <div className="mt-3 flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-300">Socket.io connection ready for implementation</span>
          </div>
        </div>
      </div>
    </main>
  )
}

