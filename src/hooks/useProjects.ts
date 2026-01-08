import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Project } from '@/types'
import * as storage from '@/utils/storage'
import { isElectron, getAPI } from '@/api'

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
    async function loadProjects() {
      if (isElectron()) {
        const api = getAPI()
        const dbProjects = await api.projects.getAll()
        setProjects(dbProjects)
      } else {
        setProjects(storage.getProjects())
      }
      setLoading(false)
    }
    loadProjects()
  }, [])

  const addProject = useCallback(async (project: Omit<Project, 'id' | 'createdAt' | 'color'>) => {
    const currentProjects = isElectron() ? await getAPI().projects.getAll() : storage.getProjects()
    const usedColors = new Set(currentProjects.map((p) => p.color))
    const availableColor = PROJECT_COLORS.find((c) => !usedColors.has(c)) || PROJECT_COLORS[0]

    const newProject: Project = {
      ...project,
      id: uuidv4(),
      color: availableColor,
      createdAt: new Date().toISOString(),
    }

    if (isElectron()) {
      await getAPI().projects.add(newProject)
    } else {
      storage.addProject(newProject)
    }
    setProjects((prev) => [...prev, newProject])
    return newProject
  }, [])

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    if (isElectron()) {
      const currentProjects = await getAPI().projects.getAll()
      const project = currentProjects.find((p) => p.id === id)
      if (project) {
        await getAPI().projects.update({ ...project, ...updates })
      }
    } else {
      storage.updateProject(id, updates)
    }
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
  }, [])

  const deleteProject = useCallback(async (id: string) => {
    if (isElectron()) {
      await getAPI().projects.delete(id)
    } else {
      storage.deleteProject(id)
    }
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
