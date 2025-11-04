declare module 'jspdf' {
  export interface jsPDFOptions {
    orientation?: 'p' | 'portrait' | 'l' | 'landscape'
    unit?: 'pt' | 'mm' | 'cm' | 'in'
    format?: string | number[]
  }

  export class jsPDF {
    constructor(options?: jsPDFOptions)
    setFont(font: string, style?: string): this
    setFontSize(size: number): this
    setTextColor(r: number, g?: number, b?: number): this
    setDrawColor(r: number, g?: number, b?: number): this
    setLineWidth(width: number): this
    text(text: string | string[], x: number, y: number): this
    roundedRect(x: number, y: number, w: number, h: number, rx: number, ry: number, style?: string): this
    addPage(): this
    line(x1: number, y1: number, x2: number, y2: number): this
    splitTextToSize(text: string, size: number): string[]
    output(type?: 'arraybuffer' | 'blob' | string): any
    internal: any
    addFileToVFS(filename: string, data: string): this
    addFont(postScriptNameOrFile: string, fontName?: string, fontStyle?: string, encoding?: string): this
  }
}


