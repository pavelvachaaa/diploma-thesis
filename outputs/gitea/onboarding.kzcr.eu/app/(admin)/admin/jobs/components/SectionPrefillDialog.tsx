"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SectionPrefillMode } from "./sectionPrefill"

interface SectionPrefillDialogProps {
  open: boolean
  mode: SectionPrefillMode
  onConfirm: () => void
  onCancel: () => void
  onOpenChange: (open: boolean) => void
}

const DIALOG_COPY: Record<
  SectionPrefillMode,
  {
    title: string
    description: string
    confirmLabel: string
    cancelLabel: string
  }
> = {
  merge: {
    title: "Přidat položky ze specializace?",
    description:
      "Nabídka byla vygenerována pomocí AI. Chcete k ní přidat náplň práce, požadavky a benefity z vybrané specializace?",
    confirmLabel: "Ano, přidat",
    cancelLabel: "Ne, ponechat",
  },
  replace: {
    title: "Přepsat vyplněné sekce?",
    description:
      "Sekce už obsahují text. Chcete je nahradit automatickým předvyplněním ze zvolené specializace?",
    confirmLabel: "Ano, přepsat",
    cancelLabel: "Ne, ponechat moje texty",
  },
}

export default function SectionPrefillDialog({
  open,
  mode,
  onConfirm,
  onCancel,
  onOpenChange,
}: SectionPrefillDialogProps) {
  const copy = DIALOG_COPY[mode]

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>{copy.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{copy.cancelLabel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{copy.confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
