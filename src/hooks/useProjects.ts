import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Project } from '@/types'
import * as storage from '@/utils/storage'

const PROJECT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
]

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setProjects(storage.getProjects())
    setLoading(false)
  }, [])

  const addProject = useCallback((project: Omit<Project, 'id' | 'createdAt' | 'color'>) => {
    const usedColors = new Set(storage.getProjects().map((p) => p.color))
    const availableColor = PROJECT_COLORS.find((c) => !usedColors.has(c)) || PROJECT_COLORS[0]

    const newProject: Project = {
      ...project,
      id: uuidv4(),
      color: availableColor,
      createdAt: new Date().toISOString(),
    }
    storage.addProject(newProject)
    setProjects((prev) => [...prev, newProject])
    return newProject
  }, [])

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    storage.updateProject(id, updates)
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
  }, [])

  const deleteProject = useCallback((id: string) => {
    storage.deleteProject(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const getActiveProjects = useCallback(() => {
    return projects.filter((p) => p.active)
  }, [projects])

  return {
    projects,
    loading,
    addProject,
    updateProject,
    deleteProject,
    getActiveProjects,
  }
}
