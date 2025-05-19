"use client"

import { motion } from "framer-motion"

type LoadingScreenProps = {
  text?: string
}

export default function LoadingScreen({ text = "Espera mientras cargamos todo" }: LoadingScreenProps) {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-background">
      <motion.div
        className="flex flex-col items-center gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Spinner animado */}
        <div className="relative">
          <motion.div
            className="w-20 h-20 border-4 border-gray-200 dark:border-gray-700 rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
          <motion.div
            className="absolute top-0 left-0 w-20 h-20 border-4 border-t-[var(--selected)]  border-r-transparent border-b-transparent border-l-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
        </div>

        {/* Texto con animación */}
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{text}</h2>
          <motion.div
            className="flex space-x-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {[0, 1, 2].map((dot) => (
              <motion.div
                key={dot}
                className="w-2 h-2 bg-[var(--selected)]  rounded-full"
                animate={{ y: [0, -5, 0] }}
                transition={{
                  duration: 0.8,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "loop",
                  delay: dot * 0.2,
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
