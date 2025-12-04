import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { deleteAccount } from "@/app/actions/account"

export default function EmployerSettings() {
  return (
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
  )
}

