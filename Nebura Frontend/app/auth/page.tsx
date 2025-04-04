"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login")
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  })
  const [passwordStrength, setPasswordStrength] = useState(0)
  const { toast } = useToast()

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setRegisterForm((prev) => ({ ...prev, [name]: value }))

    if (name === "password") {
      calculatePasswordStrength(value)
    }
  }

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLoginForm((prev) => ({ ...prev, [name]: value }))
  }

  const calculatePasswordStrength = (password: string) => {
    // Simple password strength calculation
    let strength = 0

    if (password.length >= 8) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1

    setPasswordStrength(strength)
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (passwordStrength < 3) {
      toast({
        title: "Error",
        description: "Please use a stronger password",
        variant: "destructive",
      })
      return
    }

    // Here you would normally send the data to your API
    console.log("Register data:", registerForm)

    // Show success notification
    toast({
      title: "Registration Successful",
      description: "Your account has been created successfully.",
    })

    // Reset form
    setRegisterForm({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    })
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!loginForm.email || !loginForm.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    // Here you would normally send the data to your API
    console.log("Login data:", loginForm)

    // Show success notification
    toast({
      title: "Login Successful",
      description: "You have been logged in successfully.",
    })

    // Reset form
    setLoginForm({
      email: "",
      password: "",
    })
  }

  // Password strength indicator component inline
  const PasswordStrengthIndicator = ({ strength }: { strength: number }) => {
    const getStrengthText = () => {
      switch (strength) {
        case 0:
          return "Very Weak"
        case 1:
          return "Weak"
        case 2:
          return "Medium"
        case 3:
          return "Strong"
        case 4:
          return "Very Strong"
        default:
          return "Very Weak"
      }
    }

    const getStrengthColor = () => {
      switch (strength) {
        case 0:
          return "bg-red-500"
        case 1:
          return "bg-orange-500"
        case 2:
          return "bg-yellow-500"
        case 3:
          return "bg-green-500"
        case 4:
          return "bg-green-600"
        default:
          return "bg-red-500"
      }
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Password Strength:</span>
          <span
            className={`text-xs font-medium ${
              strength === 0
                ? "text-red-500"
                : strength === 1
                  ? "text-orange-500"
                  : strength === 2
                    ? "text-yellow-500"
                    : strength === 3
                      ? "text-green-500"
                      : "text-green-600"
            }`}
          >
            {getStrengthText()}
          </span>
        </div>
        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: `${(strength / 4) * 100}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-950">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center text-gray-400 mb-6 hover:text-teal-500 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <Card className="w-full border border-gray-800 bg-gray-900">
          <CardHeader className="space-y-1 border-b border-gray-800">
            <CardTitle className="text-2xl font-bold text-white text-center">Welcome</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800 rounded-none">
              <TabsTrigger value="login" className="data-[state=active]:bg-gray-700">
                Login
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-gray-700">
                Register
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-gray-300">
                      Email
                    </Label>
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginForm.email}
                      onChange={handleLoginChange}
                      required
                      className="bg-gray-800 border-gray-700 text-white focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-gray-300">
                      Password
                    </Label>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      value={loginForm.password}
                      onChange={handleLoginChange}
                      required
                      className="bg-gray-800 border-gray-700 text-white focus:border-teal-500"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white">
                    Login
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={handleRegister}>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="text-gray-300">
                      Name
                    </Label>
                    <Input
                      id="register-name"
                      name="name"
                      placeholder="John Doe"
                      value={registerForm.name}
                      onChange={handleRegisterChange}
                      required
                      className="bg-gray-800 border-gray-700 text-white focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-gray-300">
                      Email
                    </Label>
                    <Input
                      id="register-email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      value={registerForm.email}
                      onChange={handleRegisterChange}
                      required
                      className="bg-gray-800 border-gray-700 text-white focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-gray-300">
                      Password
                    </Label>
                    <Input
                      id="register-password"
                      name="password"
                      type="password"
                      value={registerForm.password}
                      onChange={handleRegisterChange}
                      required
                      className="bg-gray-800 border-gray-700 text-white focus:border-teal-500"
                    />
                    <PasswordStrengthIndicator strength={passwordStrength} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password" className="text-gray-300">
                      Confirm Password
                    </Label>
                    <Input
                      id="register-confirm-password"
                      name="confirmPassword"
                      type="password"
                      value={registerForm.confirmPassword}
                      onChange={handleRegisterChange}
                      required
                      className="bg-gray-800 border-gray-700 text-white focus:border-teal-500"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white">
                    Register
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </main>
  )
}

