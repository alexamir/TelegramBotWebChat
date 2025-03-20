import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Dashboard() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Bot Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage bot users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">0</div>
            <p className="text-sm text-gray-500 mb-4">Total registered users</p>
            <Link href="/dashboard/users">
              <Button variant="outline" className="w-full">
                View Users
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
            <CardDescription>View user conversations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">0</div>
            <p className="text-sm text-gray-500 mb-4">Total messages</p>
            <Link href="/dashboard/conversations">
              <Button variant="outline" className="w-full">
                View Conversations
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bitrix24 Deals</CardTitle>
            <CardDescription>Manage CRM deals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">0</div>
            <p className="text-sm text-gray-500 mb-4">Total deals created</p>
            <Link href="/dashboard/deals">
              <Button variant="outline" className="w-full">
                View Deals
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Bot Settings</CardTitle>
            <CardDescription>Configure your Telegram bot</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Webhook Status</h3>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Active</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Quick Actions</h3>
                <div className="flex flex-col gap-2">
                  <Link href="/api/telegram/webhook?secret=your-secret-here">
                    <Button variant="outline" size="sm" className="w-full">
                      Update Webhook
                    </Button>
                  </Link>
                  <Link href="/api/setup-db?secret=your-secret-here">
                    <Button variant="outline" size="sm" className="w-full">
                      Setup Database
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

