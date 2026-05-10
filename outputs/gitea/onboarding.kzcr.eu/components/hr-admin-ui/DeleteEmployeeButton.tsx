"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteEmployee } from "@/lib/api/employees"
import { useAuth } from "@/context/AuthContext"

interface DeleteEmployeeButtonProps {
  employeeId: string
  employeeName: string
  redirectPath?: string
}

export function DeleteEmployeeButton({
  employeeId,
  employeeName,
  redirectPath = "/admin/employees",
}: DeleteEmployeeButtonProps) {
  const router = useRouter()
  const { roles, userId } = useAuth()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isSuperAdmin = roles.includes("super_admin")
  const isSelf = userId === employeeId

  if (!isSuperAdmin) {
    return null
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteEmployee(employeeId)
      toast.success(`Zaměstnanec "${employeeName}" byl trvale smazán`)
      setOpen(false)
      router.push(redirectPath)
      router.refresh()
    } catch (error) {
      console.error("Failed to fully delete employee:", error)
      toast.error(error instanceof Error ? error.message : "Nepodařilo se smazat zaměstnance")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          disabled={isSelf}
          title={isSelf ? "Nelze smazat vlastní účet" : "Trvale smazat zaměstnance"}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Smazat zaměstnance
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Opravdu trvale smazat zaměstnance?</AlertDialogTitle>
          <AlertDialogDescription>
            Tato akce je nevratná. Smaže uživatelský účet zaměstnance, jeho přístupy do organizací,
            onboarding data, uživatelské dokumenty a související chat zprávy.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800">
          Uživatel: <strong>{employeeName}</strong>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Zrušit</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault()
              void handleDelete()
            }}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Mazání..." : "Ano, trvale smazat"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
