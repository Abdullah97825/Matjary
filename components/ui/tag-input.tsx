'use client'

import { useState, useRef, KeyboardEvent, useEffect } from 'react'
import { X } from 'lucide-react'
import { Input } from './input'
import { UITag } from '@/types/tags'
import { cn } from '@/lib/utils'

interface TagInputProps {
  tags: UITag[]
  onTagsChange: (tags: UITag[]) => void
  suggestions?: UITag[]
  className?: string
}

export function TagInput({ tags, onTagsChange, suggestions = [], className }: TagInputProps) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !inputRef.current?.contains(event.target as Node) &&
        !suggestionsRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredSuggestions = suggestions.filter(suggestion => 
    suggestion.name.toLowerCase().includes(input.toLowerCase()) &&
    !tags.some(tag => tag.name.toLowerCase() === suggestion.name.toLowerCase())
  )

  const addTag = (tagName: string) => {
    const normalizedName = tagName.trim().toLowerCase()
    if (normalizedName && !tags.some(tag => tag.name.toLowerCase() === normalizedName)) {
      // Check if tag exists in suggestions
      const existingTag = suggestions.find(s => s.name.toLowerCase() === normalizedName)
      onTagsChange([...tags, existingTag || { id: Date.now().toString(), name: normalizedName }])
    }
    setInput('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const removeTag = (tagToRemove: UITag) => {
    onTagsChange(tags.filter(tag => tag.id !== tagToRemove.id))
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      
      if (!input.trim()) return
      
      const exactMatch = filteredSuggestions.find(
        s => s.name.toLowerCase() === input.toLowerCase()
      )
      
      if (exactMatch) {
        addTag(exactMatch.name)
      } else if (filteredSuggestions.length > 0 && input.toLowerCase() === filteredSuggestions[0].name.toLowerCase()) {
        addTag(filteredSuggestions[0].name)
      } else {
        addTag(input)
      }
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const suggestionsList = document.querySelector('[role="listbox"]')
      const firstOption = suggestionsList?.querySelector('[role="option"]') as HTMLElement
      firstOption?.focus()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }

  const handleSuggestionKeyDown = (e: KeyboardEvent<HTMLButtonElement>, suggestion: UITag) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        addTag(suggestion.name)
        break
      case 'ArrowDown':
        e.preventDefault()
        const nextSibling = e.currentTarget.nextElementSibling as HTMLElement
        if (nextSibling) {
          nextSibling.focus()
        } else {
          // Cycle back to first suggestion
          const firstSuggestion = e.currentTarget.parentElement?.firstElementChild as HTMLElement
          firstSuggestion?.focus()
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        const prevSibling = e.currentTarget.previousElementSibling as HTMLElement
        if (prevSibling) {
          prevSibling.focus()
        } else {
          // Cycle to last suggestion or back to input
          const lastSuggestion = e.currentTarget.parentElement?.lastElementChild as HTMLElement
          if (e.currentTarget === lastSuggestion) {
            inputRef.current?.focus()
          } else {
            lastSuggestion?.focus()
          }
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowSuggestions(false)
        inputRef.current?.blur()
        break
      default:
        // Allow typing while navigating suggestions
        if (e.key.length === 1) {
          setInput(prev => prev + e.key)
          inputRef.current?.focus()
        }
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2 rounded-md border p-2">
        {tags.map(tag => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm"
          >
            {tag.name}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-primary/50 hover:text-primary"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <div className="relative flex-1 min-w-[200px]">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={(e) => {
              // Only hide suggestions if not clicking on a suggestion
              if (!suggestionsRef.current?.contains(e.relatedTarget)) {
                // Small delay to allow clicking suggestions
                setTimeout(() => setShowSuggestions(false), 200)
              }
            }}
            onKeyDown={handleKeyDown}
            className="border-0 p-0 focus-visible:ring-0"
            placeholder="Type to add tags..."
          />
          {(showSuggestions && filteredSuggestions.length > 0) && (
            <div 
              ref={suggestionsRef}
              className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg"
              role="listbox"
            >
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  className="w-full px-3 py-2 text-left hover:bg-accent text-sm flex items-center justify-between focus:bg-accent focus:outline-none"
                  onClick={() => addTag(suggestion.name)}
                  onKeyDown={(e) => handleSuggestionKeyDown(e, suggestion)}
                  type="button"
                  role="option"
                  tabIndex={0}
                >
                  <span>{suggestion.name}</span>
                  {index === 0 && input.toLowerCase() === suggestion.name.toLowerCase() && (
                    <span className="text-xs text-muted-foreground">press enter</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 