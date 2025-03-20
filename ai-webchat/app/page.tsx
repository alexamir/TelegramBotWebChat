import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import ChatWidget from "@/components/chat-widget"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md mb-8">
        <CardHeader>
          <CardTitle>AI Web Chat Demo</CardTitle>
          <CardDescription>AI-powered web chat with Bitrix24 integration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            This demo showcases an AI-powered web chat that captures contact information, conducts a dynamic survey, and
            provides AI-powered responses. All interactions are synced with Bitrix24 CRM.
          </p>

          <div className="grid gap-2">
            <h3 className="text-sm font-medium">Quick Links</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  Dashboard
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline" className="w-full">
                  Admin Panel
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chat Widget */}
      <div className="fixed bottom-4 right-4 z-50">
        <ChatWidget />
      </div>
    </main>
  )
}

