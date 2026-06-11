param(
  [Parameter(Mandatory = $true)][string]$PngPath,
  [Parameter(Mandatory = $true)][string]$PrinterName,
  [int]$Dpi = 203
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path -LiteralPath $PngPath)) {
  throw "PNG not found: $PngPath"
}

$img = [System.Drawing.Bitmap]::FromFile($PngPath)
try {
  # Physical page from bitmap pixels (1/100 inch units) — do not rely on driver PageBounds.
  $script:PaperWidthHi = [int][Math]::Round(($img.Width / $Dpi) * 100)
  $script:PaperHeightHi = [int][Math]::Max(50, [int][Math]::Round(($img.Height / $Dpi) * 100))

  $doc = New-Object System.Drawing.Printing.PrintDocument
  $doc.OriginAtMargins = $false
  $doc.PrinterSettings.PrinterName = $PrinterName
  if (-not $doc.PrinterSettings.IsValid) {
    throw "Invalid printer: $PrinterName"
  }

  $doc.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(0, 0, 0, 0)
  $doc.DefaultPageSettings.Landscape = $false

  $customPaper = New-Object System.Drawing.Printing.PaperSize('FMJSlip', $script:PaperWidthHi, $script:PaperHeightHi)
  try {
    $doc.DefaultPageSettings.PaperSize = $customPaper
  } catch {
    # Driver may reject custom size — we still draw at full PaperWidthHi x PaperHeightHi below.
  }

  $printPage = {
    param($sender, $e)
    $bitmap = $script:SlipBitmap
    $hardX = $e.PageSettings.HardMarginX
    $hardY = $e.PageSettings.HardMarginY
    # Nudge down ~0.75mm so the top border/barcode stay inside the printable area (no extra blank band).
    $topGuardHi = [int][Math]::Round((0.75 / 25.4) * 100)
    $drawW = $script:PaperWidthHi
    $drawH = $script:PaperHeightHi

    $e.Graphics.PageUnit = [System.Drawing.GraphicsUnit]::Display
    # Nearest-neighbor keeps 1:1 thermal dots sharp (bicubic softens text/bars).
    $e.Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $e.Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $e.Graphics.DrawImage($bitmap, (-$hardX), (-$hardY + $topGuardHi), $drawW, $drawH)
    $e.HasMorePages = $false
  }

  $script:SlipBitmap = $img
  $doc.add_PrintPage($printPage)
  $doc.Print()
} finally {
  if ($null -ne $img) {
    $img.Dispose()
  }
}
