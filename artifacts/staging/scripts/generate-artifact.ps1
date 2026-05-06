param(
    [string]$OutputDir = "artifacts"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$artifactName = "orphanage-management-system-$timestamp.zip"
$artifactDir = Join-Path $projectRoot $OutputDir
$stagingDir = Join-Path $artifactDir "staging"
$artifactPath = Join-Path $artifactDir $artifactName

function Remove-DirectorySafely {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (-not (Test-Path $Path)) {
        return
    }

    Get-ChildItem -Path $Path -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
        if (-not $_.PSIsContainer) {
            $_.Attributes = 'Normal'
        }
    }

    try {
        Remove-Item -LiteralPath $Path -Recurse -Force -ErrorAction Stop
    } catch {
        Write-Warning "Could not fully remove staging directory: $Path"
    }
}

if (Test-Path $stagingDir) {
    Remove-DirectorySafely -Path $stagingDir
}

New-Item -ItemType Directory -Path $artifactDir -Force | Out-Null
New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null

$excludePatterns = @(
    "\.git($|\\)",
    "\\artifacts($|\\)",
    "\\node_backend\\node_modules($|\\)",
    "\\node_backend\\.env$"
)

$files = Get-ChildItem -Path $projectRoot -Recurse -File | Where-Object {
    $fullName = $_.FullName
    -not ($excludePatterns | Where-Object { $fullName -match $_ })
}

foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($projectRoot.Length).TrimStart('\')
    $destinationPath = Join-Path $stagingDir $relativePath
    $destinationFolder = Split-Path -Parent $destinationPath

    if (-not (Test-Path $destinationFolder)) {
        New-Item -ItemType Directory -Path $destinationFolder -Force | Out-Null
    }

    Copy-Item -LiteralPath $file.FullName -Destination $destinationPath -Force
}

if (Test-Path $artifactPath) {
    Remove-Item -LiteralPath $artifactPath -Force
}

Compress-Archive -Path (Join-Path $stagingDir '*') -DestinationPath $artifactPath -CompressionLevel Optimal
Start-Sleep -Milliseconds 500
Remove-DirectorySafely -Path $stagingDir

Write-Output "Artifact created: $artifactPath"
