param([string]$SourceRoot, [string]$SponsorsRoot)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName WindowsBase
$frontend = Split-Path $PSScriptRoot -Parent
$root = Split-Path $frontend -Parent
if (-not $SourceRoot) { $SourceRoot = Join-Path $root 'Images Microsoft website\Events Photos' }
if (-not $SponsorsRoot) { $SponsorsRoot = Join-Path $root 'Sponser' }
$destination = Join-Path $frontend 'public\club-media\community-import'
New-Item -ItemType Directory -Path $destination -Force | Out-Null
if (-not ('ClubMediaBounds' -as [type])) {
    Add-Type -ReferencedAssemblies @([Windows.Media.Imaging.BitmapSource].Assembly.Location, [Windows.Int32Rect].Assembly.Location) -TypeDefinition @'
using System;
using System.Windows;
using System.Windows.Media;
using System.Windows.Media.Imaging;
public static class ClubMediaBounds {
    public static Int32Rect Find(BitmapSource source) {
        var image = new FormatConvertedBitmap(source, PixelFormats.Bgra32, null, 0);
        var pixels = new byte[image.PixelWidth * image.PixelHeight * 4];
        image.CopyPixels(pixels, image.PixelWidth * 4, 0);
        int left = image.PixelWidth, top = image.PixelHeight, right = -1, bottom = -1;
        for (int row = 0; row < image.PixelHeight; row++) {
            for (int column = 0; column < image.PixelWidth; column++) {
                if (pixels[(row * image.PixelWidth + column) * 4 + 3] <= 8) continue;
                left = Math.Min(left, column); right = Math.Max(right, column);
                top = Math.Min(top, row); bottom = Math.Max(bottom, row);
            }
        }
        if (right < left) throw new InvalidOperationException("Fully transparent logo.");
        return new Int32Rect(left, top, right - left + 1, bottom - top + 1);
    }
}
'@
}
function Read-Image([string]$source) {
    $stream = [IO.File]::OpenRead($source)
    try {
        $metadataFrame = [Windows.Media.Imaging.BitmapDecoder]::Create($stream, [Windows.Media.Imaging.BitmapCreateOptions]::DelayCreation, [Windows.Media.Imaging.BitmapCacheOption]::None).Frames[0]
        $orientation = 1
        foreach ($query in @('/app1/ifd/{ushort=274}', '/ifd/{ushort=274}')) {
            try { if ($metadataFrame.Metadata -and $metadataFrame.Metadata.ContainsQuery($query)) { $orientation = [int]$metadataFrame.Metadata.GetQuery($query); break } } catch [NotSupportedException] { }
        }
        $decodeWidth = [Math]::Max(1, [int]($metadataFrame.PixelWidth * [Math]::Min([double]1, 1280.0 / [Math]::Max($metadataFrame.PixelWidth, $metadataFrame.PixelHeight))))
        $stream.Position = 0
        $frame = [Windows.Media.Imaging.BitmapImage]::new()
        $frame.BeginInit()
        $frame.CacheOption = [Windows.Media.Imaging.BitmapCacheOption]::OnLoad
        $frame.DecodePixelWidth = $decodeWidth
        $frame.StreamSource = $stream
        $frame.EndInit()
        $frame.Freeze()
    } catch { throw "Cannot decode image '$source': $($_.Exception.Message)" } finally { $stream.Dispose() }
    $transform = [Windows.Media.TransformGroup]::new()
    if ($orientation -in @(2, 4, 5, 7)) { $transform.Children.Add([Windows.Media.ScaleTransform]::new(-1, 1)) }
    $angle = switch ($orientation) { 3 { 180 } 4 { 180 } 5 { 270 } 6 { 90 } 7 { 90 } 8 { 270 } default { 0 } }
    if ($angle) { $transform.Children.Add([Windows.Media.RotateTransform]::new($angle)) }
    if ($transform.Children.Count) { return [Windows.Media.Imaging.TransformedBitmap]::new($frame, $transform) }
    return $frame
}
function Save-Image($image, [string]$filePath, [int]$maxWidth, [int]$maxHeight, [switch]$Png) {
    $ratio = [Math]::Min([double]1, [Math]::Min([double]$maxWidth / $image.PixelWidth, [double]$maxHeight / $image.PixelHeight))
    $resized = [Windows.Media.Imaging.TransformedBitmap]::new($image, [Windows.Media.ScaleTransform]::new($ratio, $ratio))
    $encoder = if ($Png) { [Windows.Media.Imaging.PngBitmapEncoder]::new() } else { $jpeg = [Windows.Media.Imaging.JpegBitmapEncoder]::new(); $jpeg.QualityLevel = 82; $jpeg }
    $encoder.Frames.Add([Windows.Media.Imaging.BitmapFrame]::Create($resized))
    $output = [IO.File]::Create($filePath)
    try { $encoder.Save($output) } finally { $output.Dispose() }
    return [pscustomobject]@{ width = $resized.PixelWidth; height = $resized.PixelHeight }
}
$imageFiles = @(Get-ChildItem -LiteralPath $SourceRoot -File -Recurse | Where-Object { $_.Extension -match '^\.(jpe?g|png|heic)$' })
$albumNumber = 0
$photoCount = 0
$heicCount = 0
$albums = @($imageFiles | Group-Object DirectoryName | Sort-Object Name | ForEach-Object {
    $albumNumber++
    $relative = $_.Name.Substring($SourceRoot.TrimEnd('\').Length).TrimStart('\')
    $hash = [Security.Cryptography.SHA256]::Create()
    try { $id = 'album-' + ([BitConverter]::ToString($hash.ComputeHash([Text.Encoding]::UTF8.GetBytes($relative)))).Replace('-', '').Substring(0, 10).ToLowerInvariant() } finally { $hash.Dispose() }
    $files = @($_.Group | Sort-Object Name)
    $chosen = @(@($files[0], $files[[int][Math]::Floor(($files.Count - 1) / 2)], $files[-1]) + @($files | Where-Object { $_.Name -match '^All[ _-]*Team\.' -or $_.Extension -ieq '.heic' }) | Sort-Object FullName -Unique)
    $photoNumber = 0
    $photos = @($chosen | ForEach-Object {
        $photoNumber++; $photoCount++
        if ($_.Extension -ieq '.heic') { $heicCount++ }
        $image = Read-Image $_.FullName
        $variants = @(foreach ($size in @(640, 1280)) {
            $filename = "$id-$photoNumber-$size.jpg"
            $dimensions = Save-Image $image (Join-Path $destination $filename) $size $size
            [pscustomobject]@{ src = "/club-media/community-import/$filename"; width = $dimensions.width; height = $dimensions.height }
        })
        $variants = @($variants | Sort-Object width -Unique)
        [pscustomobject][ordered]@{ src = $variants[-1].src; srcSet = ($variants | ForEach-Object { "$($_.src) $($_.width)w" }) -join ', '; width = $variants[-1].width; height = $variants[-1].height; isTeam = ($_.Name -match '^All[ _-]*Team\.'); sourceFormat = $_.Extension.ToLowerInvariant() }
        $image = $null
        [GC]::Collect()
        [GC]::WaitForPendingFinalizers()
    })
    [pscustomobject][ordered]@{ id = $id; title = $relative.Replace('\', ' / '); photos = $photos }
})
$logos = @(Get-ChildItem -LiteralPath $SponsorsRoot -File -Filter '*.png' -Recurse | Where-Object { $_.BaseName -notmatch '\(2\)$' } | Sort-Object FullName | ForEach-Object {
    $image = Read-Image $_.FullName
    $crop = [Windows.Media.Imaging.CroppedBitmap]::new($image, [ClubMediaBounds]::Find($image))
    $id = ($_.BaseName.ToLowerInvariant() -replace '[^a-z0-9]+', '-').Trim('-')
    $filename = "logo-$id.png"
    $dimensions = Save-Image $crop (Join-Path $destination $filename) 600 300 -Png
    [pscustomobject][ordered]@{ id = $id; name = $_.BaseName; src = "/club-media/community-import/$filename"; width = $dimensions.width; height = $dimensions.height }
    $crop = $null
    $image = $null
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
})
if (-not $albums.Count -or -not $logos.Count) { throw 'No albums or sponsor logos were imported.' }
[IO.File]::WriteAllText((Join-Path $frontend 'src\content\communityMedia.json'), (ConvertTo-Json -InputObject $albums -Depth 7) + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $frontend 'src\content\supporterLogos.json'), (ConvertTo-Json -InputObject $logos -Depth 4) + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
$bytes = (Get-ChildItem -LiteralPath $destination -File | Measure-Object Length -Sum).Sum
Write-Output "Imported $photoCount photos from $($albums.Count) albums ($heicCount HEIC), $($logos.Count) logos; $([Math]::Round($bytes / 1MB, 2)) MB. Originals unchanged."