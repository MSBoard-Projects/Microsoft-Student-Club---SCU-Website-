param([switch]$InspectOnly, [switch]$PrepareOnly)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$frontend = Split-Path $PSScriptRoot -Parent
$root = Split-Path $frontend -Parent
$mediaRoot = Join-Path $root 'Microsoft Data'

function Read-PhotoWorkbook([string]$path) {
    $archive = [IO.Compression.ZipFile]::OpenRead($path)
    try {
        function Read-XmlPart([string]$part) {
            $entry = $archive.GetEntry($part)
            if (-not $entry) { throw "Missing workbook part: $part" }
            $reader = [IO.StreamReader]::new($entry.Open())
            try { return [xml]$reader.ReadToEnd() } finally { $reader.Dispose() }
        }
        $strings = @()
        if ($archive.GetEntry('xl/sharedStrings.xml')) {
            $shared = Read-XmlPart 'xl/sharedStrings.xml'
            $strings = @($shared.SelectNodes('//*[local-name()="si"]') | ForEach-Object {
                ($_.SelectNodes('.//*[local-name()="t"]') | ForEach-Object { $_.InnerText }) -join ''
            })
        }
        $workbook = Read-XmlPart 'xl/workbook.xml'
        $sheet = $workbook.SelectSingleNode('//*[local-name()="sheet"]')
        $relationships = Read-XmlPart 'xl/_rels/workbook.xml.rels'
        $relationId = $sheet.GetAttribute('id', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
        $relation = $relationships.SelectNodes('//*[local-name()="Relationship"]') | Where-Object { $_.Id -eq $relationId }
        $target = $relation.Target
        $document = Read-XmlPart $(if ($target.StartsWith('/')) { $target.TrimStart('/') } else { "xl/$target" })
        $rows = @($document.SelectNodes('//*[local-name()="sheetData"]/*[local-name()="row"]') | ForEach-Object {
            $values = @{}
            foreach ($cell in $_.SelectNodes('*[local-name()="c"]')) {
                $value = $cell.SelectSingleNode('*[local-name()="v"]')
                $text = if ($cell.t -eq 's') { $strings[[int]$value.InnerText] } elseif ($cell.t -eq 'inlineStr') {
                    ($cell.SelectNodes('.//*[local-name()="t"]') | ForEach-Object { $_.InnerText }) -join ''
                } else { $value.InnerText }
                $values[$cell.r -replace '\d', ''] = "$text".Trim()
            }
            $values
        })
        return [pscustomobject]@{ Headers = $rows[0]; Rows = @($rows | Select-Object -Skip 1) }
    } finally { $archive.Dispose() }
}

$roster = Read-PhotoWorkbook (Join-Path $root 'Certificates_PDF\MailMerge_Data.xlsx')
$workbooks = @(Get-ChildItem -LiteralPath $mediaRoot -Filter '*.xlsx' | Sort-Object Name)
$responses = @()
foreach ($file in $workbooks) {
    $sheet = Read-PhotoWorkbook $file.FullName
    $nameColumn = ($sheet.Headers.GetEnumerator() | Where-Object { $_.Value -match '^((Full\s*Name|Name)(\s*\(In English\))?|Triple Name In English)$' } | Select-Object -First 1).Key
    $photoColumn = ($sheet.Headers.GetEnumerator() | Where-Object { $_.Value -match 'photo|image' } | Select-Object -First 1).Key
    $emailColumn = ($sheet.Headers.GetEnumerator() | Where-Object { $_.Value -match '^E-?mail$' } | Select-Object -First 1).Key
    if (-not $nameColumn -or -not $photoColumn -or -not $emailColumn) { throw "Unsupported photo workbook schema: $($file.Name)" }
    $folder = if ($file.Name -like 'Board*') { 'Board' } else { 'Members' }
    foreach ($row in $sheet.Rows) {
        if ($row[$nameColumn] -and $row[$emailColumn]) {
            $responses += [pscustomobject]@{ Name = $row[$nameColumn]; Email = $row[$emailColumn].ToLowerInvariant(); Folder = $folder; HasPhoto = [bool]$row[$photoColumn] }
        }
    }
}

$columns = @{}
foreach ($required in @('Name', 'Email', 'Certificate_PDF_File')) {
    $matches = @($roster.Headers.GetEnumerator() | Where-Object { $_.Value -eq $required })
    if ($matches.Count -ne 1) { throw "Expected one roster column named $required" }
    $columns[$required] = $matches[0].Key
}
$rosterById = @{}
foreach ($row in $roster.Rows | Where-Object { $_[$columns.Name] }) {
    $identifier = if ($row[$columns.Certificate_PDF_File]) { [IO.Path]::GetFileNameWithoutExtension($row[$columns.Certificate_PDF_File]) -replace '^Certificate_', '' } else { $row[$columns.Name] }
    $id = $identifier.ToLowerInvariant() -replace '[^a-z0-9]+', '-'
    if ($rosterById.ContainsKey($id)) { throw "Duplicate roster ID: $id" }
    $rosterById[$id] = $row
}
$outputPath = Join-Path $frontend 'src\content\membersData.json'
$members = @(Get-Content -LiteralPath $outputPath -Raw -Encoding UTF8 | ConvertFrom-Json | ForEach-Object { $_ })
if ($members.Count -ne $rosterById.Count) { throw 'Public roster is out of date. Run Import-Members.ps1 first.' }
$publicIds = @{}
foreach ($member in $members) {
    if ($publicIds.ContainsKey($member.id) -or -not $rosterById.ContainsKey($member.id) -or $member.fullName -cne $rosterById[$member.id][$columns.Name]) { throw "Public roster mismatch: $($member.id). Run Import-Members.ps1 first." }
    $publicIds[$member.id] = $true
}
$folders = @{ Board = 'Board\Image (File responses)'; Members = 'Members\Your Photo (File responses)' }
$confirmedPortraits = @{
    'ahmed-eyada' = 'Ahmed Eyadaa.jpg'
    'ahmed-hariedy' = 'Ahmed Hariedy.jpg'
    'haidy-mohamed-salah' = 'Haidy mohamed salah.jpg'
    'salwa-alaa-eldin-hegazy' = 'Salwa.jpg'
    'mohamed-abdelazim' = 'Mohamed Abdelazim.jpeg'
}
$manifest = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'member-photo-matches.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$selected = @{}
$usedSources = @{}
foreach ($entry in $manifest) {
    if (-not $rosterById.ContainsKey($entry.id)) { throw "Photo is not authorized by the certificate roster: $($entry.id)" }
    if ($selected.ContainsKey($entry.id)) { throw "Duplicate photo assignment: $($entry.id)" }
    if (-not $folders.ContainsKey($entry.folder) -or $entry.pattern -match '[/\\]') { throw "Invalid photo source: $($entry.id)" }
    $verification = if ($entry.verification) { $entry.verification } else { 'email' }
    if ($verification -eq 'filename') {
        if ($entry.id -ne 'ali-arabi-ali' -or $entry.pattern -cne 'Ali Arabi.jpg') { throw 'Only the explicit President portrait can bypass the response workbooks.' }
    } elseif ($verification -eq 'user-confirmed') {
        if ($entry.folder -cne 'Board' -or -not $confirmedPortraits.ContainsKey($entry.id) -or $entry.pattern -cne $confirmedPortraits[$entry.id]) { throw "Unconfirmed portrait assignment: $($entry.id)" }
    } elseif ($verification -in @('email', 'name')) {
        $responseMatches = @($responses | Where-Object { $_.Folder -eq $entry.folder -and $_.Name -eq $entry.responseName -and $_.HasPhoto })
        if ($verification -eq 'email') { $responseMatches = @($responseMatches | Where-Object { $_.Email -eq $rosterById[$entry.id][$columns.Email].ToLowerInvariant() }) }
        if ($responseMatches.Count -eq 0) { throw "Photo response no longer matches: $($entry.id)" }
    } else { throw "Unsupported verification method: $verification" }
    $files = @(Get-ChildItem -LiteralPath (Join-Path $mediaRoot $folders[$entry.folder]) -File | Where-Object { $_.Name -like $entry.pattern })
    if ($files.Count -ne 1) { throw "Expected one local portrait for $($entry.id); found $($files.Count)" }
    if ($files[0].Extension.ToLowerInvariant() -notin @('.jpg', '.jpeg', '.png', '.webp', '.pdf')) { throw "Unsupported portrait format: $($entry.id)" }
    if ($usedSources.ContainsKey($files[0].FullName)) { throw "Source assigned to multiple profiles: $($entry.id)" }
    $usedSources[$files[0].FullName] = $true
    $selected[$entry.id] = [pscustomobject]@{ File = $files[0]; Verification = $verification }
}
if ($selected.Count -eq 0) { throw 'No reviewed portraits selected.' }
Write-Output "Validated $($selected.Count) reviewed portraits against $($rosterById.Count) authorized profiles. No extra profiles will be added."
$members | Where-Object { -not $selected.ContainsKey($_.id) } | ForEach-Object { Write-Output "Unassigned: $($_.fullName) [$($_.positionTitle)]" }
if ($InspectOnly) { return }

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Data.Pdf.PdfDocument, Windows.Data.Pdf, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime]
$null = [Windows.Data.Pdf.PdfPageRenderOptions, Windows.Data.Pdf, ContentType = WindowsRuntime]

function Wait-WindowsOperation($operation, [Type]$resultType) {
    $method = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetGenericArguments().Count -eq 1 -and $_.GetParameters().Count -eq 1 } | Select-Object -First 1
    $task = $method.MakeGenericMethod($resultType).Invoke($null, @($operation))
    $task.GetAwaiter().GetResult()
}

function Open-Portrait([IO.FileInfo]$file) {
    if ($file.Extension -eq '.pdf') {
        $storageFile = Wait-WindowsOperation ([Windows.Storage.StorageFile]::GetFileFromPathAsync($file.FullName)) ([Windows.Storage.StorageFile])
        $pdf = Wait-WindowsOperation ([Windows.Data.Pdf.PdfDocument]::LoadFromFileAsync($storageFile)) ([Windows.Data.Pdf.PdfDocument])
        if ($pdf.PageCount -ne 1) { throw "Portrait PDF must have exactly one page: $($file.Name)" }
        $page = $pdf.GetPage(0)
        $randomStream = [Windows.Storage.Streams.InMemoryRandomAccessStream]::new()
        try {
            $options = [Windows.Data.Pdf.PdfPageRenderOptions]::new()
            $options.DestinationWidth = [uint32]720
            $action = $page.RenderToStreamAsync($randomStream, $options)
            $method = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and -not $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 } | Select-Object -First 1
            $task = $method.Invoke($null, @($action))
            $null = $task.GetAwaiter().GetResult()
            $stream = [System.IO.WindowsRuntimeStreamExtensions]::AsStreamForRead($randomStream)
            $image = [Drawing.Image]::FromStream($stream)
            try { return [Drawing.Bitmap]::new($image) } finally { $image.Dispose(); $stream.Dispose() }
        } finally { $page.Dispose(); $randomStream.Dispose() }
    }
    if ($file.Extension -eq '.webp') {
        $stream = [IO.File]::OpenRead($file.FullName)
        $buffer = [IO.MemoryStream]::new()
        try {
            $decoder = [Windows.Media.Imaging.BitmapDecoder]::Create($stream, [Windows.Media.Imaging.BitmapCreateOptions]::PreservePixelFormat, [Windows.Media.Imaging.BitmapCacheOption]::OnLoad)
            $encoder = [Windows.Media.Imaging.PngBitmapEncoder]::new()
            $encoder.Frames.Add($decoder.Frames[0])
            $encoder.Save($buffer)
            $buffer.Position = 0
            $image = [Drawing.Image]::FromStream($buffer)
            try { return [Drawing.Bitmap]::new($image) } finally { $image.Dispose() }
        } finally { $stream.Dispose(); $buffer.Dispose() }
    }
    return [Drawing.Image]::FromFile($file.FullName)
}

$staging = Join-Path ([IO.Path]::GetTempPath()) ('msc-member-portraits-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $staging | Out-Null
$jpegEncoder = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$parameters = [Drawing.Imaging.EncoderParameters]::new(1)
$parameters.Param[0] = [Drawing.Imaging.EncoderParameter]::new([Drawing.Imaging.Encoder]::Quality, [long]84)
$published = @{}
$failures = @{}
try {
    $report = @($members | ForEach-Object {
        $member = $_
        $selection = $selected[$member.id]
        if ($selection) {
            $image = $null
            try {
                $image = Open-Portrait $selection.File
                if ($image.PropertyIdList -contains 274) {
                    $orientation = [int][BitConverter]::ToUInt16($image.GetPropertyItem(274).Value, 0)
                    $rotations = @{ 2 = 'RotateNoneFlipX'; 3 = 'Rotate180FlipNone'; 4 = 'RotateNoneFlipY'; 5 = 'Rotate90FlipX'; 6 = 'Rotate90FlipNone'; 7 = 'Rotate270FlipX'; 8 = 'Rotate270FlipNone' }
                    if ($rotations.ContainsKey($orientation)) { $image.RotateFlip([Drawing.RotateFlipType]::$($rotations[$orientation])) }
                }
                $scale = [Math]::Min([double]1, [double]720 / [Math]::Max($image.Width, $image.Height))
                $bitmap = [Drawing.Bitmap]::new([Math]::Max(1, [int]($image.Width * $scale)), [Math]::Max(1, [int]($image.Height * $scale)))
                $graphics = [Drawing.Graphics]::FromImage($bitmap)
                try {
                    $graphics.Clear([Drawing.Color]::White)
                    $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                    $graphics.DrawImage($image, 0, 0, $bitmap.Width, $bitmap.Height)
                    if ($bitmap.Width -lt 100 -or $bitmap.Height -lt 100 -or $bitmap.Width -gt 720 -or $bitmap.Height -gt 720) { throw 'Portrait dimensions must be between 100 and 720 pixels.' }
                    $bitmap.Save((Join-Path $staging ($member.id + '.jpg')), $jpegEncoder, $parameters)
                } finally { $graphics.Dispose(); $bitmap.Dispose() }
                $published[$member.id] = $true
                $member.imageUrl = '/club-media/members/' + $member.id + '.jpg'
            } catch {
                if ($_.FullyQualifiedErrorId -notlike 'NotSupportedException*') { throw }
                $failures[$member.id] = $true
                if ($member.imageUrl -like '/club-media/members/*') { $member.imageUrl = $null }
                Write-Warning "Portrait conversion skipped for $($member.fullName): $($_.Exception.Message)"
            } finally { if ($image) { $image.Dispose() } }
        } elseif ($member.imageUrl -like '/club-media/members/*') { $member.imageUrl = $null }
        [pscustomobject][ordered]@{
            id = $member.id
            fullName = $member.fullName
            status = if ($failures.ContainsKey($member.id)) { 'conversion-skipped' } elseif ($selection) { 'matched' } else { 'unassigned' }
            source = if ($selection) { $selection.File.FullName.Substring($mediaRoot.Length + 1).Replace('\', '/') } else { $null }
            verification = if ($selection) { $selection.Verification } else { $null }
        }
    })
} finally { $parameters.Dispose() }
Write-Output "Prepared portraits: $staging"
Write-Output "Prepared $($published.Count); conversion skipped: $($failures.Count)."
if ($PrepareOnly) { return }
if ($published.Count -eq 0) { throw 'No portraits converted; refusing to change public files.' }
$destination = Join-Path $frontend 'public\club-media\members'
New-Item -ItemType Directory -Path $destination -Force | Out-Null
Get-ChildItem -LiteralPath $staging -Filter '*.jpg' | Where-Object { $published.ContainsKey($_.BaseName) } | ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $destination -Force }
Get-ChildItem -LiteralPath $destination -Filter '*.jpg' | Where-Object { -not $published.ContainsKey($_.BaseName) } | ForEach-Object { Remove-Item -LiteralPath $_.FullName }
[IO.File]::WriteAllText($outputPath, (ConvertTo-Json -InputObject $members -Depth 4) + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $PSScriptRoot 'member-photo-report.json'), (ConvertTo-Json -InputObject $report -Depth 4) + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
$bytes = (Get-ChildItem -LiteralPath $destination -Filter '*.jpg' | Measure-Object Length -Sum).Sum
Write-Output "Published $($published.Count) optimized portraits ($([Math]::Round($bytes / 1MB, 2)) MB); skipped $($failures.Count). Originals and live databases unchanged."