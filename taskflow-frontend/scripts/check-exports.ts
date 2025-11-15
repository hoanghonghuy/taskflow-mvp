#!/usr/bin/env node

/**
 * Export Consistency Checker
 * 
 * This script verifies that all components have consistent exports
 * and prevents export/import mismatches.
 * 
 * Run: npm run check-exports
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

interface ExportInfo {
  file: string
  hasDefault: boolean
  hasNamed: boolean
  exports: string[]
}

function checkExports(dir: string, baseDir: string = dir): ExportInfo[] {
  const results: ExportInfo[] = []
  const files = readdirSync(dir)

  for (const file of files) {
    const fullPath = join(dir, file)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      results.push(...checkExports(fullPath, baseDir))
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = readFileSync(fullPath, 'utf-8')
      const relativePath = fullPath.replace(baseDir, '').replace(/\\/g, '/')
      
      const hasDefault = /export\s+default/.test(content)
      const namedExports = content.match(/export\s+(?:const|function|class|interface|type)\s+(\w+)/g) || []
      const reExports = content.match(/export\s*\{\s*([^}]+)\s*\}/g) || []
      
      const exports: string[] = [
        ...namedExports.map(e => e.match(/(\w+)$/)?.[1]).filter(Boolean) as string[],
        ...reExports.flatMap(e => {
          const matches = e.match(/\{([^}]+)\}/)?.[1]
          return matches?.split(',').map(s => s.trim().split(/\s+as\s+/)[0]).filter(Boolean) || []
        })
      ]

      results.push({
        file: relativePath,
        hasDefault,
        hasNamed: namedExports.length > 0 || reExports.length > 0,
        exports: [...new Set(exports)],
      })
    }
  }

  return results
}

function main() {
  const componentsDir = join(process.cwd(), 'src/components/ui')
  const results = checkExports(componentsDir)

  console.log('\n📦 Export Consistency Check\n')
  console.log('=' .repeat(60))

  let hasErrors = false

  for (const result of results) {
    if (result.file.includes('index.ts') || result.file.includes('README')) continue

    const issues: string[] = []

    // Check if component has exports
    if (!result.hasDefault && !result.hasNamed) {
      issues.push('❌ No exports found')
      hasErrors = true
    }

    // Check if component has both default and named (recommended for UI components)
    if (result.hasDefault && !result.hasNamed) {
      issues.push('⚠️  Has default export but no named export (consider adding both)')
    }

    if (issues.length > 0) {
      console.log(`\n📄 ${result.file}`)
      issues.forEach(issue => console.log(`   ${issue}`))
      if (result.exports.length > 0) {
        console.log(`   Exports: ${result.exports.join(', ')}`)
      }
    }
  }

  if (!hasErrors) {
    console.log('\n✅ All components have proper exports!')
  } else {
    console.log('\n❌ Some components have export issues. Please fix them.')
    process.exit(1)
  }

  console.log('\n' + '='.repeat(60))
}

main()

