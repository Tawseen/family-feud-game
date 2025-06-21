import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function CategorySelection({ categories, onSelect }) {
  const [selected, setSelected] = useState(null);

  const chooseCategory = (cat) => {
    setSelected(cat);
    onSelect(cat);
  };

  useEffect(() => {
    if (selected) {
      // Could add side-effects here if needed
    }
  }, [selected]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4 py-8"
    >
      <h1 className="text-4xl font-bold mb-8 text-center">Select a Category</h1>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-xl">
        {categories.map((cat) => (
          <motion.li
            key={cat}
            role="button"
            tabIndex={0}
            aria-selected={selected === cat}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => chooseCategory(cat)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") chooseCategory(cat);
            }}
            className={`cursor-pointer rounded-lg p-6 text-center font-semibold text-xl
              border-4
              ${
                selected === cat
                  ? "border-blue-500 bg-blue-100 text-blue-800"
                  : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
              }
              transition-colors duration-300 select-none
            `}
          >
            {cat}
          </motion.li>
        ))}
      </ul>
      {selected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center text-green-700 font-semibold"
          aria-live="polite"
        >
          Category <span className="underline">{selected}</span> selected!
        </motion.div>
      )}
    </motion.div>
  );
}
