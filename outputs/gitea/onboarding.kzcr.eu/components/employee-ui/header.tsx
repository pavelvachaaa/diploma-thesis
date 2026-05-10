"use client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "../ui/button";
import { DashboardSidebar } from "./dashboard-sidebar-employee";
import { useState } from "react";
import { Bell, LogOut, Menu } from "lucide-react";
import Link from "next/link";


export default function Header() {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (

        <header className="sticky top-0 z-10 border-b bg-white">
            <div className="container flex h-16 items-center px-4">
                <div className="flex items-center gap-2">
                    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                        <SheetTrigger asChild className="lg:hidden">
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side="left"
                            className="w-[240px] sm:w-[300px] lg:hidden"
                        >
                            <div className="flex h-full flex-col">
                                <div className="flex items-center gap-2 border-b py-4">
                                    <img
                                        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-YvCjhctnKaadJIPTOMrSKz6EYzSHW4.png"
                                        alt="Krajská zdravotní nemocnice Ústeckého kraje"
                                        className="h-8"
                                    />
                                </div>
                                <nav className="flex-1 overflow-auto py-4">
                                    <DashboardSidebar
                                        currentPath="/dashboard"
                                        remindersCount={3}
                                        onCloseMobile={() => setSidebarOpen(false)}
                                    />
                                </nav>
                                <div className="border-t py-4">
                                    <Link
                                        href="/"
                                        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Odhlásit se
                                    </Link>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                    <Link href="/" className="flex items-center gap-2">
                        <img
                            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-YvCjhctnKaadJIPTOMrSKz6EYzSHW4.png"
                            alt="Krajská zdravotní nemocnice Ústeckého kraje"
                            className="h-8"
                        />
                    </Link>
                </div>

                {/* RIGHT SECTION */}
                <div className="flex items-center gap-4 ml-auto">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href="/dashboard/notifications">
                                    <Button variant="ghost" size="icon" className="relative">
                                        <Bell className="h-5 w-5" />
                                        {3 > 0 && (
                                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                                                {3}
                                            </span>
                                        )}
                                        <span className="sr-only">Notifikace</span>
                                    </Button>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Máte {3} nepřečtených notifikací</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                    <Avatar>
                                        <AvatarImage
                                            src="/placeholder.svg?height=32&width=32"
                                            alt="Jan Novák"
                                        />
                                        <AvatarFallback>JN</AvatarFallback>
                                    </Avatar>
                                    <span className="sr-only">Uživatelské menu</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Jan Novák - Lékař</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
        </header>

    );

}