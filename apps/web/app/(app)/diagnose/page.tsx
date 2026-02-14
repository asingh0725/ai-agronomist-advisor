"use client"

import Link from "next/link"
import { Camera, FileSpreadsheet, ChevronRight } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const inputMethods = [
  {
    id: 'photo',
    title: 'Photo + Description',
    description: 'Upload a field photo and describe what you see',
    icon: Camera,
    href: '/diagnose/photo',
    time: '~2 min'
  },
  {
    id: 'lab-report',
    title: 'Lab Report Data',
    description: 'Enter soil test results for precise recommendations',
    icon: FileSpreadsheet,
    href: '/diagnose/lab-report',
    time: '~5 min'
  }
]

export default function DiagnosePage() {
  return (
    <div className="container max-w-5xl py-8 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Diagnose</span>
      </div>

      {/* Header - centered */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-3">
          Diagnose Your Crop Issue
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Choose your preferred method to get personalized recommendations
        </p>
      </div>

      {/* Input Method Cards - centered grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {inputMethods.map((method) => {
          const Icon = method.icon
          return (
            <Link key={method.id} href={method.href}>
              <Card className="h-full transition-all hover:shadow-lg hover:border-primary cursor-pointer">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {method.time}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{method.title}</CardTitle>
                  <CardDescription className="text-base mt-2">
                    {method.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button variant="outline" className="w-full">
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
