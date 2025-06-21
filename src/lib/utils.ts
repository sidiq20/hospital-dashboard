import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility function to remove undefined values from objects
export function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        // Recursively clean nested objects
        const cleaned = removeUndefined(value);
        if (Object.keys(cleaned).length > 0) {
          result[key as keyof T] = cleaned as T[keyof T];
        }
      } else if (Array.isArray(value)) {
        // Clean arrays by removing undefined values and cleaning nested objects
        const cleanedArray = value
          .filter(item => item !== undefined)
          .map(item => {
            if (item && typeof item === 'object' && !(item instanceof Date)) {
              return removeUndefined(item);
            }
            return item;
          });
        if (cleanedArray.length > 0) {
          result[key as keyof T] = cleanedArray as T[keyof T];
        }
      } else {
        result[key as keyof T] = value;
      }
    }
  }
  
  return result;
}