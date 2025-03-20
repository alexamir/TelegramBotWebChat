import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AdminChats() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Active Chats</h1>
        <Link href="/admin">
          <Button variant="outline">Back to Admin</Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-medium">Current Chat Sessions</h2>
        </div>

        <div className="p-4">
          <p className="text-gray-500 text-center py-8">No active chat sessions found.</p>

          {/* This would be replaced with actual chat sessions data */}
          {/* 
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{session.userData.fullName || session.userData.companyName}</p>
                  <p className="text-sm text-gray-500">Started: {new Date(session.createdAt).toLocaleString()}</p>
                </div>
                <Link href={`/admin/chats/${session.sessionId}`}>
                  <Button>Join Chat</Button>
                </Link>
              </div>
            ))}
          </div>
          */}
        </div>
      </div>
    </div>
  )
}

