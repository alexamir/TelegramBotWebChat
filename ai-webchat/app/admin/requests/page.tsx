import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ManagerRequests() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manager Requests</h1>
        <Link href="/admin">
          <Button variant="outline">Back to Admin</Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-medium">Pending Manager Assistance</h2>
        </div>

        <div className="p-4">
          <p className="text-gray-500 text-center py-8">No pending manager requests found.</p>

          {/* This would be replaced with actual manager requests data */}
          {/* 
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{request.userData.fullName || request.userData.companyName}</p>
                  <p className="text-sm text-gray-500">Requested: {new Date(request.timestamp).toLocaleString()}</p>
                </div>
                <div className="space-x-2">
                  <Link href={`/admin/chats/${request.sessionId}`}>
                    <Button>Join Chat</Button>
                  </Link>
                  <Button variant="outline">Dismiss</Button>
                </div>
              </div>
            ))}
          </div>
          */}
        </div>
      </div>
    </div>
  )
}

