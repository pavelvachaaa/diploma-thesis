'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowUp } from 'lucide-react'

export default function ScrollToTop() {
    const [visible, setVisible] = useState(false)
    const lastScrollY = useRef(0)

    useEffect(() => {
        const handleScroll = () => {
            const currentY = window.scrollY
            const scrollingUp = currentY < lastScrollY.current
            const pastThreshold = currentY > 300

            setVisible(scrollingUp && pastThreshold)
            lastScrollY.current = currentY
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-600 shadow-md hover:bg-gray-50 transition-opacity duration-300 cursor-pointer font-medium ${
                visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            aria-label="Nahoru"
        >
            <ArrowUp className="h-4 w-4" />
            Nahoru
        </button>
    )
}
