import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AdminPanel() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Chats</CardTitle>
            <CardDescription>Manage ongoing conversations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">0</div>
            <p className="text-sm text-gray-500 mb-4">Active chat sessions</p>
            <Link href="/admin/chats">
              <Button variant="outline" className="w-full">
                View Active Chats
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manager Requests</CardTitle>
            <CardDescription>Pending manager assistance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">0</div>
            <p className="text-sm text-gray-500 mb-4">Pending requests</p>
            <Link href="/admin/requests">
              <Button variant="outline" className="w-full">
                View Requests
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
            <Link href="/admin/deals">
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
            <CardTitle>Chat Settings</CardTitle>
            <CardDescription>Configure your web chat</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Chat Status</h3>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Active</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Quick Actions</h3>
                <div className="flex flex-col gap-2">
                  <Link href="/api/setup-db?secret=your-secret-here">
                    <Button variant="outline" size="sm" className="w-full">
                      Setup Database
                    </Button>
                  </Link>
                  <Link href="/admin/settings">
                    <Button variant="outline" size="sm" className="w-full">
                      Chat Settings
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

