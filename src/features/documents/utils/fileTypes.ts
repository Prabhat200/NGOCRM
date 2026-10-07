import {
  FileText,
  FileSpreadsheet,
  FileArchive,
  Image,
  File,
  type LucideIcon,
} from 'lucide-react'

export interface FileTypeInfo {
  label: string
  icon: LucideIcon
  colorClass: string
  bgClass: string
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const formatted = parseFloat((bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1))
  return `${formatted} ${sizes[i]}`
}

export function getFileTypeInfo(mimeType?: string | null, filename?: string | null): FileTypeInfo {
  const mime = mimeType?.toLowerCase() || ''
  const ext = filename?.split('.').pop()?.toLowerCase() || ''

  if (mime.includes('pdf') || ext === 'pdf') {
    return {
      label: 'PDF',
      icon: FileText,
      colorClass: 'text-rose-600',
      bgClass: 'bg-rose-50 border-rose-200',
    }
  }

  if (
    mime.includes('word') ||
    mime.includes('wordprocessingml') ||
    ext === 'doc' ||
    ext === 'docx'
  ) {
    return {
      label: 'Word',
      icon: FileText,
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-50 border-blue-200',
    }
  }

  if (
    mime.includes('sheet') ||
    mime.includes('excel') ||
    ext === 'xls' ||
    ext === 'xlsx' ||
    ext === 'csv'
  ) {
    return {
      label: 'Spreadsheet',
      icon: FileSpreadsheet,
      colorClass: 'text-emerald-600',
      bgClass: 'bg-emerald-50 border-emerald-200',
    }
  }

  if (
    mime.includes('presentation') ||
    mime.includes('powerpoint') ||
    ext === 'ppt' ||
    ext === 'pptx'
  ) {
    return {
      label: 'Presentation',
      icon: FileText,
      colorClass: 'text-amber-600',
      bgClass: 'bg-amber-50 border-amber-200',
    }
  }

  if (
    mime.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)
  ) {
    return {
      label: 'Image',
      icon: Image,
      colorClass: 'text-purple-600',
      bgClass: 'bg-purple-50 border-purple-200',
    }
  }

  if (
    mime.includes('zip') ||
    mime.includes('compressed') ||
    ['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)
  ) {
    return {
      label: 'Archive',
      icon: FileArchive,
      colorClass: 'text-slate-600',
      bgClass: 'bg-slate-100 border-slate-200',
    }
  }

  return {
    label: ext ? ext.toUpperCase() : 'Document',
    icon: File,
    colorClass: 'text-slate-600',
    bgClass: 'bg-slate-100 border-slate-200',
  }
}
