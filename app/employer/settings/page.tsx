import Link from 'next/link'
import { LayoutDashboard, Briefcase, Building2, Settings, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { deleteAccount } from "@/app/actions/account"

export default function EmployerSettings() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r">
          <div className="p-6">
            <Link href="/" className="text-xl font-bold text-[#0A2540]">
              Unison AI
            </Link>
          </div>
          <nav className="px-4 space-y-2">
            <Link
              href="/employer/dashboard"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Dashboard
            </Link>
            <Link
              href="/employer/jobs"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <Briefcase className="w-5 h-5 mr-3" />
              Jobs
            </Link>
            <Link
              href="/employer/employees"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <Users className="w-5 h-5 mr-3" />
              Employees
            </Link>
            <Link
              href="/employer/company"
              className="flex items-center px-4 py-3 text-[#333333] hover:bg-gray-100 rounded-lg"
            >
              <Building2 className="w-5 h-5 mr-3" />
              Company profile
            </Link>
            <Link
              href="/employer/settings"
              className="flex items-center px-4 py-3 text-[#FF7A00] bg-[#FF7A00]/10 rounded-lg"
            >
              <Settings className="w-5 h-5 mr-3" />
              Settings
            </Link>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold text-[#0A2540] mb-4">Settings</h1>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-[#0A2540]">Account</CardTitle>
                  <CardDescription className="text-[#333333]">Manage account and company settings.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 text-[#333333] space-y-2">
                    <li>
                      Update company details on the{' '}
                      <Link href="/employer/company" className="text-[#FF7A00] underline">Company profile</Link> page.
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-[#0A2540]">Danger zone</CardTitle>
                  <CardDescription className="text-red-600">Deleting your account is irreversible. All related data (company, jobs, applications) will be removed.</CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Delete account</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete account?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. Your account and associated data will be permanently deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <form action={deleteAccount}>
                          <AlertDialogAction type="submit" className="bg-red-600 hover:bg-red-700">
                            Confirm deletion
                          </AlertDialogAction>
                        </form>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

