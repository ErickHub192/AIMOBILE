import { NextRequest } from 'next/server'

export async function readJson<T extends Record<string, unknown>>(request: NextRequest): Promise<T> {
  try {
    return (await request.json()) as T
  } catch {
    return {} as T
  }
}

export function readTextField(body: Record<string, unknown>, key: string) {
  const value = body[key]
  return typeof value === 'string' ? value.trim() : ''
}
