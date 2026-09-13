param([switch]$InspectOnly)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$source = Join-Path $root 'Certificates_PDF'
$archive = [IO.Compression.ZipFile]::OpenRead((Join-Path $source 'MailMerge_Data.xlsx'))

function Read-ArchiveXml([string]$name) {
    $entry = $archive.GetEntry($name)
    if (-not $entry) { throw "Missing workbook entry: $name" }
    $reader = [IO.StreamReader]::new($entry.Open())
    try { return [xml]$reader.ReadToEnd() } finally { $reader.Dispose() }
}

try {
    $strings = @()
    if ($archive.GetEntry('xl/sharedStrings.xml')) {
        $shared = Read-ArchiveXml 'xl/sharedStrings.xml'
        $strings = @($shared.SelectNodes('//*[local-name()="si"]') | ForEach-Object {
            ($_.SelectNodes('.//*[local-name()="t"]') | ForEach-Object { $_.InnerText }) -join ''
        })
    }
    $workbook = Read-ArchiveXml 'xl/workbook.xml'
    $relationships = Read-ArchiveXml 'xl/_rels/workbook.xml.rels'
    $sheet = $workbook.SelectSingleNode('//*[local-name()="sheet"]')
    $relationId = $sheet.GetAttribute('id', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
    $relation = $relationships.SelectNodes('//*[local-name()="Relationship"]') | Where-Object { $_.Id -eq $relationId }
    $target = $relation.Target
    $sheetPath = if ($target.StartsWith('/')) { $target.TrimStart('/') } else { "xl/$target" }
    $document = Read-ArchiveXml $sheetPath
    $rows = @($document.SelectNodes('//*[local-name()="sheetData"]/*[local-name()="row"]') | ForEach-Object {
        $values = @{}
        foreach ($cell in $_.SelectNodes('*[local-name()="c"]')) {
            $column = $cell.r -replace '\d', ''
            $value = $cell.SelectSingleNode('*[local-name()="v"]')
            $text = if ($cell.t -eq 's') { $strings[[int]$value.InnerText] } elseif ($cell.t -eq 'inlineStr') {
                ($cell.SelectNodes('.//*[local-name()="t"]') | ForEach-Object { $_.InnerText }) -join ''
            } else { $value.InnerText }
            $values[$column] = "$text".Trim()
        }
        $values
    })
    $headers = $rows[0]
    Write-Output "Sheet: $($sheet.name); data rows: $($rows.Count - 1)"
    $headers.GetEnumerator() | Sort-Object Name | ForEach-Object { Write-Output "$($_.Key): $($_.Value)" }
    $positionColumn = ($headers.GetEnumerator() | Where-Object { $_.Value -eq 'Position' }).Key
    if ($positionColumn) {
        $rows | Select-Object -Skip 1 | Group-Object { $_[$positionColumn] } | Sort-Object Name | Select-Object Name, Count | Format-Table -AutoSize
    }
    if ($InspectOnly) { return }
    $columns = @{}
    foreach ($required in @('Name', 'Role', 'Position', 'Certificate_PDF_File')) {
        $matches = @($headers.GetEnumerator() | Where-Object { $_.Value -eq $required })
        if ($matches.Count -ne 1) { throw "Expected one column named $required" }
        $columns[$required] = $matches[0].Key
    }
    $groups = @{ 'Member' = 'member'; 'Board' = 'board'; 'High Board' = 'high-board'; 'Instructure' = 'instructor'; 'Instructor' = 'instructor' }
    $outputPath = Join-Path (Split-Path $PSScriptRoot -Parent) 'src\content\membersData.json'
    $destination = Join-Path (Split-Path $PSScriptRoot -Parent) 'public\club-certificates'
    $existingImages = @{}
    if (Test-Path -LiteralPath $outputPath) {
        Get-Content -LiteralPath $outputPath -Raw -Encoding UTF8 | ConvertFrom-Json | ForEach-Object { $existingImages[$_.id] = $_.imageUrl }
    }
    $seen = @{}
    $certificates = @()
    $members = @($rows | Select-Object -Skip 1 | ForEach-Object {
        $name = $_[$columns['Name']]
        if (-not [string]::IsNullOrWhiteSpace($name)) {
            $position = $_[$columns['Position']]
            if ($name -eq 'Ali Arabi Ali' -and [string]::IsNullOrWhiteSpace($position) -and $_[$columns['Role']] -eq 'President') { $position = 'High Board' }
            if ([string]::IsNullOrWhiteSpace($position) -or -not $groups.ContainsKey($position)) { throw "Unknown Position for ${name}: '$position'; role: $($_[$columns['Role']])" }
            $role = $_[$columns['Role']]
            if ([string]::IsNullOrWhiteSpace($role)) { throw "Missing Role for $name" }
            $certificate = $_[$columns['Certificate_PDF_File']]
            if ($certificate -and ($certificate -match '[/\\]' -or [IO.Path]::GetExtension($certificate) -ne '.pdf')) {
                throw "Expected a PDF filename for $name"
            }
            $certificatePath = if ($certificate) { Join-Path $source $certificate } else { $null }
            $hasCertificate = $certificatePath -and (Test-Path -LiteralPath $certificatePath -PathType Leaf)
            if (-not $hasCertificate) { Write-Warning "Certificate not available for $name; public link will be omitted." }
            $identifier = if ($certificate) { [IO.Path]::GetFileNameWithoutExtension($certificate) -replace '^Certificate_', '' } else { $name }
            $id = $identifier.ToLowerInvariant() -replace '[^a-z0-9]+', '-'
            if ($seen.ContainsKey($id)) { throw "Duplicate certificate/member identifier: $id" }
            $seen[$id] = $true
            if ($hasCertificate) { $certificates += $certificatePath }
            [pscustomobject][ordered]@{
                id = $id
                fullName = $name
                positionTitle = $role
                group = $groups[$position]
                imageUrl = if ($existingImages.ContainsKey($id)) { $existingImages[$id] } else { $null }
                certificateUrl = if ($hasCertificate) { '/club-certificates/' + [Uri]::EscapeDataString($certificate) } else { $null }
            }
        }
    })
    if ($members.Count -eq 0) { throw 'No members found; refusing to replace public data.' }
    New-Item -ItemType Directory -Path $destination -Force | Out-Null
    foreach ($certificatePath in $certificates) {
        $targetPath = Join-Path $destination ([IO.Path]::GetFileName($certificatePath))
        if (-not (Test-Path -LiteralPath $targetPath) -or (Get-FileHash -LiteralPath $certificatePath).Hash -ne (Get-FileHash -LiteralPath $targetPath).Hash) {
            Copy-Item -LiteralPath $certificatePath -Destination $targetPath
        }
    }
    [IO.File]::WriteAllText($outputPath, (ConvertTo-Json -InputObject $members -Depth 4) + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
    $members | Group-Object group | Sort-Object Name | Select-Object Name, Count | Format-Table -AutoSize
    Write-Output "Published $($members.Count) members with $($certificates.Count) explicitly matched PDFs. Contact fields and workbook excluded."
} finally { $archive.Dispose() }