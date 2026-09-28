$ErrorActionPreference = 'Stop'

$gameVersion = '1.20.1'
$loader = 'forge'
$modDirectory = Join-Path $PSScriptRoot 'libs'
$headers = @{ 'User-Agent' = 'AlienEvoExpansion/1.0 (development setup)' }
$queue = [System.Collections.Generic.Queue[object]]::new()
$seen = [System.Collections.Generic.HashSet[string]]::new()
$resolved = [System.Collections.Generic.List[object]]::new()

@('alienevo', 'omni-evo', 'into-the-omniverse') | ForEach-Object {
    $queue.Enqueue([pscustomobject]@{ Project = $_; Version = $null })
}

New-Item -ItemType Directory -Force -Path $modDirectory | Out-Null

while ($queue.Count -gt 0) {
    $request = $queue.Dequeue()
    if ($request.Version) {
        $version = Invoke-RestMethod -Uri "https://api.modrinth.com/v2/version/$($request.Version)" -Headers $headers
    } else {
        $encodedLoaders = [uri]::EscapeDataString("[`"$loader`"]")
        $encodedVersions = [uri]::EscapeDataString("[`"$gameVersion`"]")
        $versions = Invoke-RestMethod -Uri "https://api.modrinth.com/v2/project/$($request.Project)/version?loaders=$encodedLoaders&game_versions=$encodedVersions" -Headers $headers
        $version = $versions | Where-Object { $_.version_type -eq 'release' } | Select-Object -First 1
        if (-not $version) { $version = $versions | Select-Object -First 1 }
    }

    if (-not $version) { throw "Nenhuma versão Forge $gameVersion encontrada para $($request.Project)." }
    if (-not $seen.Add($version.project_id)) { continue }

    $resolved.Add([pscustomobject]@{
        Project = $version.project_id
        Version = $version.id
        Name = $version.name
    })

    $file = $version.files | Where-Object primary | Select-Object -First 1
    if (-not $file) { $file = $version.files | Select-Object -First 1 }
    $destination = Join-Path $modDirectory $file.filename

    if (-not (Test-Path $destination)) {
        Write-Host "Baixando $($version.name): $($file.filename)"
        Invoke-WebRequest -Uri $file.url -Headers $headers -OutFile $destination
    } else {
        Write-Host "Já existe: $($file.filename)"
    }

    foreach ($dependency in $version.dependencies | Where-Object dependency_type -eq 'required') {
        if ($dependency.version_id) {
            $dependencyVersion = Invoke-RestMethod -Uri "https://api.modrinth.com/v2/version/$($dependency.version_id)" -Headers $headers
            if (-not $seen.Contains($dependencyVersion.project_id)) {
                $queue.Enqueue([pscustomobject]@{ Project = $dependencyVersion.project_id; Version = $dependency.version_id })
            }
        } elseif ($dependency.project_id -and -not $seen.Contains($dependency.project_id)) {
            $queue.Enqueue([pscustomobject]@{ Project = $dependency.project_id; Version = $null })
        }
    }
}

# ForgeGradle cannot remap mod jars kept inside another jar. Palladium bundles
# these two libraries, so expose development copies in libs as normal dependencies.
$palladiumJar = Get-ChildItem -Path $modDirectory -Filter 'palladium-*-forge.jar' | Select-Object -First 1
if (-not $palladiumJar) { throw 'Palladium não foi encontrado para extrair as bibliotecas de desenvolvimento.' }

Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($palladiumJar.FullName)
try {
    @(
        'META-INF/jars/palladiumcore-forge-1.0.1+1.20.1-forge.jar',
        'META-INF/jars/player-animation-lib-forge-1.0.2-rc1+1.20.jar'
    ) | ForEach-Object {
        $entry = $archive.GetEntry($_)
        if (-not $entry) { throw "Biblioteca interna não encontrada no Palladium: $_" }

        $destination = Join-Path $modDirectory ([System.IO.Path]::GetFileName($_))
        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $destination, $true)
    }
} finally {
    $archive.Dispose()
}

Write-Host "`nMods preparados em $modDirectory"
Get-ChildItem -Path $modDirectory -Filter '*.jar' | Sort-Object Name | Select-Object Name, Length
Write-Host "`nCoordenadas Modrinth"
$resolved | Sort-Object Name | Select-Object Name, Project, Version | ConvertTo-Json
