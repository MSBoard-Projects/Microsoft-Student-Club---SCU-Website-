$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$frontend = Split-Path $PSScriptRoot -Parent
$root = Split-Path $frontend -Parent
$source = Join-Path $root 'Images Microsoft website\Events Photos\Microsoft Oriantation 2'
$destination = Join-Path $frontend 'public\club-media\orientation-season-2'
New-Item -ItemType Directory -Path $destination -Force | Out-Null
$encoder = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$parameters = [Drawing.Imaging.EncoderParameters]::new(1)
$parameters.Param[0] = [Drawing.Imaging.EncoderParameter]::new([Drawing.Imaging.Encoder]::Quality, [long]82)
$index = 0
try {
    $manifest = @(Get-ChildItem -LiteralPath $source -Filter '*.jpg' | Sort-Object Name | ForEach-Object {
        $index++
        $image = [Drawing.Image]::FromFile($_.FullName)
        try {
            if ($image.PropertyIdList -contains 274) {
                $orientation = [BitConverter]::ToUInt16($image.GetPropertyItem(274).Value, 0)
                $rotations = @{ 2 = 'RotateNoneFlipX'; 3 = 'Rotate180FlipNone'; 4 = 'RotateNoneFlipY'; 5 = 'Rotate90FlipX'; 6 = 'Rotate90FlipNone'; 7 = 'Rotate270FlipX'; 8 = 'Rotate270FlipNone' }
                if ($rotations.ContainsKey([int]$orientation)) { $image.RotateFlip([Drawing.RotateFlipType]::$($rotations[[int]$orientation])) }
            }
            $variants = @(@([Math]::Min(640, $image.Width), [Math]::Min(1280, $image.Width)) | Select-Object -Unique | ForEach-Object {
                $width = [int]$_
                $height = [int][Math]::Round($image.Height * $width / $image.Width)
                $bitmap = [Drawing.Bitmap]::new($width, $height)
                $graphics = [Drawing.Graphics]::FromImage($bitmap)
                $filename = 'image-{0:d2}-{1}.jpg' -f $index, $width
                try {
                    $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                    $graphics.DrawImage($image, 0, 0, $width, $height)
                    $bitmap.Save((Join-Path $destination $filename), $encoder, $parameters)
                } finally { $graphics.Dispose(); $bitmap.Dispose() }
                [pscustomobject]@{ src = "/club-media/orientation-season-2/$filename"; width = $width; height = $height }
            })
            [pscustomobject][ordered]@{ src = $variants[-1].src; srcSet = ($variants | ForEach-Object { "$($_.src) $($_.width)w" }) -join ', '; width = $variants[-1].width; height = $variants[-1].height }
        } finally { $image.Dispose() }
    })
    if ($manifest.Count -eq 0) { throw 'No event images found.' }
    [IO.File]::WriteAllText((Join-Path $frontend 'src\content\season2Media.json'), (ConvertTo-Json -InputObject $manifest -Depth 4) + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
    $bytes = (Get-ChildItem -LiteralPath $destination -Filter '*.jpg' | Measure-Object Length -Sum).Sum
    Write-Output "Optimized $($manifest.Count) photos; all renditions total $([Math]::Round($bytes / 1MB, 2)) MB. Original files unchanged."
} finally { $parameters.Dispose() }