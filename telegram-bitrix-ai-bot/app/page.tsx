import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Telegram Bot Dashboard</CardTitle>
          <CardDescription>AI-powered Telegram bot with Bitrix24 integration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <h3 className="text-sm font-medium">Bot Status</h3>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span className="text-sm">Online and running</span>
            </div>
          </div>

          <div className="grid gap-2">
            <h3 className="text-sm font-medium">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/dashboard/users">
                <Button variant="outline" className="w-full">
                  View Users
                </Button>
              </Link>
              <Link href="/dashboard/conversations">
                <Button variant="outline" className="w-full">
                  Conversations
                </Button>
              </Link>
              <Link href="/dashboard/deals">
                <Button variant="outline" className="w-full">
                  Bitrix24 Deals
                </Button>
              </Link>
              <Link href="/dashboard/settings">
                <Button variant="outline" className="w-full">
                  Settings
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-2">
            <h3 className="text-sm font-medium">Documentation</h3>
            <p className="text-sm text-gray-500">
              Access the bot documentation and API references to understand how to manage and extend the bot
              functionality.
            </p>
            <Link href="/docs">
              <Button variant="link" className="p-0">
                View Documentation
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

