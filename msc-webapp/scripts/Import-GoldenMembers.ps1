param([switch]$InspectOnly)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$frontend = Split-Path $PSScriptRoot -Parent
$root = Split-Path $frontend -Parent
$archive = [IO.Compression.ZipFile]::OpenRead((Join-Path $root 'Certificates_PDF\Golden Members - Feb & April 2026.xlsx'))
function Read-Part([string]$name) {
    $reader = [IO.StreamReader]::new($archive.GetEntry($name).Open())
    try { return [xml]$reader.ReadToEnd() } finally { $reader.Dispose() }
}
function Normalize-Name([string]$name) { return ($name.Trim().ToLowerInvariant() -replace '\s+', ' ') }
$reviewedAliases = @{
    'zahraa khaled' = 'zahra-khaled'
    'dina amr ismail' = 'dina-amr'
    'roaa ali ghareeb' = 'roaa-ali'
    'esraa attia' = 'essra-attia-ali-attia'
    'ahmed mohamed' = 'ahmed-nashaat'
    'ziad abdel qader' = 'zeyad-abdalkader-mohamed'
    'yassin ahmed' = 'yassin-ahmad-mahmoud'
    'yasmin naser' = 'yasmin-nasser'
    'sara elsayed' = 'sara-elsayed-mohamed'
    'nawal samir ali' = 'nawal-samir'
    'haneen ahmad' = 'haneen-ahmed'
    'mennat allah' = 'menna-allah-amire'
    'judy ahmed' = 'judy-ahmed-mohamed'
    'kareem mohamed' = 'karim-mohamed'
    'mohamed ahmed' = 'mohamed-abdelazim'
    'mahmoud ali' = 'mahmoud-mohamed-ali'
}
try {
    $strings = @()
    if ($archive.GetEntry('xl/sharedStrings.xml')) {
        $shared = Read-Part 'xl/sharedStrings.xml'
        $strings = @($shared.SelectNodes('//*[local-name()="si"]') | ForEach-Object { ($_.SelectNodes('.//*[local-name()="t"]') | ForEach-Object { $_.InnerText }) -join '' })
    }
    $book = Read-Part 'xl/workbook.xml'
    $rels = Read-Part 'xl/_rels/workbook.xml.rels'
    $roster = @(Get-Content (Join-Path $frontend 'src\content\membersData.json') -Raw -Encoding UTF8 | ConvertFrom-Json | ForEach-Object { $_ })
    $people = [ordered]@{}
    $rowCount = 0
    foreach ($sheet in $book.SelectNodes('//*[local-name()="sheet"]')) {
        $relationId = $sheet.GetAttribute('id', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
        $target = ($rels.SelectNodes('//*[local-name()="Relationship"]') | Where-Object { $_.Id -eq $relationId }).Target
        $sheetPath = if ($target.StartsWith('/')) { $target.TrimStart('/') } else { "xl/$target" }
        $document = Read-Part $sheetPath
        $rows = @($document.SelectNodes('//*[local-name()="sheetData"]/*[local-name()="row"]') | ForEach-Object {
            $values = @{}
            foreach ($cell in $_.SelectNodes('*[local-name()="c"]')) {
                $value = $cell.SelectSingleNode('*[local-name()="v"]')
                $text = if ($cell.t -eq 's') { $strings[[int]$value.InnerText] } elseif ($cell.t -eq 'inlineStr') { ($cell.SelectNodes('.//*[local-name()="t"]') | ForEach-Object { $_.InnerText }) -join '' } else { $value.InnerText }
                $values[($cell.r -replace '\d', '')] = "$text".Trim()
            }
            $values
        })
        $columns = @{}
        foreach ($label in @('Name', 'Position/Committee', 'Date')) {
            $matches = @($rows[0].GetEnumerator() | Where-Object { $_.Value -eq $label })
            if ($matches.Count -ne 1) { throw "Missing or duplicate header: $label" }
            $columns[$label] = $matches[0].Key
        }
        foreach ($row in ($rows | Select-Object -Skip 1)) {
            $name = $row[$columns.Name]
            if ([string]::IsNullOrWhiteSpace($name)) { continue }
            $role = $row[$columns['Position/Committee']]
            if ([string]::IsNullOrWhiteSpace($role)) { throw "Missing award role: $name" }
            $date = [datetime]::ParseExact($row[$columns.Date], 'MMMM yyyy', [Globalization.CultureInfo]::InvariantCulture)
            $month = $date.ToString('yyyy-MM')
            $category = if ($role -match 'instructor|instructure') { 'instructors' } elseif ($role -match 'head') { 'heads' } else { 'members' }
            $key = Normalize-Name $name
            if (-not $people.Contains($key)) {
                $matches = @($roster | Where-Object { (Normalize-Name $_.fullName) -eq $key })
                if ($matches.Count -gt 1) { $matches = @($matches | Where-Object { (Normalize-Name $_.positionTitle) -eq (Normalize-Name $role) }) }
                if ($reviewedAliases.ContainsKey($key)) {
                    $matches = @($roster | Where-Object { $_.id -ceq $reviewedAliases[$key] })
                    if ($matches.Count -ne 1) { throw "Reviewed Golden alias has no unique roster member: $name" }
                }
                $people[$key] = [pscustomobject][ordered]@{ id = ($key -replace '[^a-z0-9]+', '-').Trim('-'); name = $name; memberId = if ($matches.Count -eq 1) { $matches[0].id } else { $null }; awards = @() }
            }
            if (@($people[$key].awards | Where-Object { $_.month -eq $month }).Count) { throw "Duplicate award in ${month}: $name" }
            $people[$key].awards += [pscustomobject][ordered]@{ month = $month; category = $category; role = $role }
            $rowCount++
        }
    }
    $records = @($people.Values | ForEach-Object { $_.awards = @($_.awards | Sort-Object month -Descending); $_ })
    if (-not $records.Count -or @($records.id | Sort-Object -Unique).Count -ne $records.Count) { throw 'Empty catalogue or colliding award identifiers.' }
    $linkedIds = @($records | Where-Object memberId | ForEach-Object memberId)
    if (@($linkedIds | Sort-Object -Unique).Count -ne $linkedIds.Count) { throw 'Multiple Golden identities resolve to the same member. Review the workbook aliases.' }
    $repeated = @($records | Where-Object { $_.awards.Count -gt 1 })
    Write-Output "$rowCount awards; $($records.Count) people; $($repeated.Count) recognised in multiple months; $(@($records | Where-Object { -not $_.memberId }).Count) profiles awaiting verified matching."
    $repeated | Group-Object { $_.awards[0].category } | Select-Object Name, Count | Format-Table -AutoSize
    if (-not $InspectOnly) {
        [IO.File]::WriteAllText((Join-Path $frontend 'src\content\goldenData.json'), (ConvertTo-Json -InputObject $records -Depth 6) + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
    }
} finally { $archive.Dispose() }