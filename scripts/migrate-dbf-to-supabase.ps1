param(
  [string]$DataDir = "C:\data",
  [string]$GdalBin = "C:\Users\Admin\AppData\Local\Programs\OSGeo4W\bin",
  [string]$LogDir = "migration-logs\dbf-import",
  [string]$PgConnection = "PG:host=aws-1-us-west-2.pooler.supabase.com port=5432 dbname=postgres user=postgres.scvsbsojxkrxrqllcykt sslmode=require active_schema=public schemas=public target_session_attrs=read-write",
  [string[]]$OnlyFiles = @()
)

$ErrorActionPreference = "Stop"

$ogr2ogr = Join-Path $GdalBin "ogr2ogr.exe"
$ogrinfo = Join-Path $GdalBin "ogrinfo.exe"

if (-not (Test-Path -LiteralPath $ogr2ogr)) {
  throw "ogr2ogr.exe no existe en $ogr2ogr"
}

if (-not (Test-Path -LiteralPath $ogrinfo)) {
  throw "ogrinfo.exe no existe en $ogrinfo"
}

if (-not (Test-Path -LiteralPath $DataDir)) {
  throw "No existe el directorio $DataDir"
}

$resolvedLogDir = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($LogDir)
New-Item -ItemType Directory -Force -Path $resolvedLogDir | Out-Null

$summaryPath = Join-Path $resolvedLogDir "summary.csv"
$currentPath = Join-Path $resolvedLogDir "current.json"
$manifestPath = Join-Path $resolvedLogDir "manifest.csv"

function Convert-ToTableName([string]$fileName) {
  $baseName = [System.IO.Path]::GetFileNameWithoutExtension($fileName).ToLowerInvariant()
  $safeName = $baseName -replace "[^a-z0-9_]", "_"
  $safeName = $safeName.Trim("_")

  if (-not $safeName) {
    throw "No se pudo crear nombre de tabla para $fileName"
  }

  return "staging_$safeName"
}

function Write-SummaryRow(
  [string]$tableName,
  [string]$fileName,
  [long]$sizeBytes,
  [string]$status,
  [datetime]$startedAt,
  [datetime]$endedAt,
  [int]$exitCode,
  [string]$message
) {
  $durationSeconds = [int]([Math]::Round(($endedAt - $startedAt).TotalSeconds))
  if ($null -eq $message) {
    $message = ""
  }
  $escapedMessage = $message -replace '"', '""'
  $row = '"{0}","{1}",{2},"{3}","{4:o}","{5:o}",{6},{7},"{8}"' -f `
    $tableName,
    $fileName,
    $sizeBytes,
    $status,
    $startedAt,
    $endedAt,
    $exitCode,
    $durationSeconds,
    $escapedMessage
  Add-Content -LiteralPath $summaryPath -Value $row
}

$dbfFiles = Get-ChildItem -LiteralPath $DataDir -File -Filter *.dbf

if ($OnlyFiles.Count -gt 0) {
  $wanted = @{}
  foreach ($name in $OnlyFiles) {
    $wanted[$name.ToLowerInvariant()] = $true
  }

  $dbfFiles = $dbfFiles | Where-Object { $wanted.ContainsKey($_.Name.ToLowerInvariant()) }
}

$dbfs = $dbfFiles |
  Sort-Object Length, Name |
  ForEach-Object {
    [PSCustomObject]@{
      FileName = $_.Name
      FullName = $_.FullName
      SizeBytes = $_.Length
      TableName = Convert-ToTableName $_.Name
    }
  }

$dbfs |
  Select-Object TableName, FileName, SizeBytes, FullName |
  Export-Csv -LiteralPath $manifestPath -NoTypeInformation -Encoding UTF8

'"table","file","size_bytes","status","started_at","ended_at","exit_code","duration_seconds","message"' |
  Set-Content -LiteralPath $summaryPath -Encoding UTF8

foreach ($dbf in $dbfs) {
  $startedAt = Get-Date
  $logPath = Join-Path $resolvedLogDir "$($dbf.TableName).log"

  [PSCustomObject]@{
    table = $dbf.TableName
    file = $dbf.FileName
    sizeBytes = $dbf.SizeBytes
    status = "running"
    startedAt = $startedAt.ToString("o")
    log = $logPath
  } | ConvertTo-Json | Set-Content -LiteralPath $currentPath -Encoding UTF8

  try {
    "[$($startedAt.ToString('o'))] Inspecting $($dbf.FullName)" |
      Set-Content -LiteralPath $logPath -Encoding UTF8
    & $ogrinfo -so -al -oo ENCODING=CP850 $dbf.FullName 2>&1 |
      Add-Content -LiteralPath $logPath -Encoding UTF8

    "[$((Get-Date).ToString('o'))] Importing into public.$($dbf.TableName)" |
      Add-Content -LiteralPath $logPath -Encoding UTF8

    $args = @(
      "-f", "PostgreSQL",
      $PgConnection,
      $dbf.FullName,
      "-nln", $dbf.TableName,
      "-nlt", "NONE",
      "-overwrite",
      "-nomd",
      "-gt", "65536",
      "-progress",
      "-oo", "ENCODING=CP850",
      "--config", "SHAPE_ENCODING", "CP850"
    )

    & $ogr2ogr @args 2>&1 |
      Add-Content -LiteralPath $logPath -Encoding UTF8

    $exitCode = $LASTEXITCODE
    $endedAt = Get-Date

    if ($exitCode -eq 0) {
      Write-SummaryRow $dbf.TableName $dbf.FileName $dbf.SizeBytes "ok" $startedAt $endedAt $exitCode ""
    } else {
      Write-SummaryRow $dbf.TableName $dbf.FileName $dbf.SizeBytes "failed" $startedAt $endedAt $exitCode "ogr2ogr termino con codigo $exitCode"
      exit $exitCode
    }
  } catch {
    $endedAt = Get-Date
    $message = $_.Exception.Message
    Add-Content -LiteralPath $logPath -Encoding UTF8 -Value $message
    Write-SummaryRow $dbf.TableName $dbf.FileName $dbf.SizeBytes "failed" $startedAt $endedAt 1 $message
    exit 1
  }
}

[PSCustomObject]@{
  status = "complete"
  completedAt = (Get-Date).ToString("o")
  summary = $summaryPath
  manifest = $manifestPath
} | ConvertTo-Json | Set-Content -LiteralPath $currentPath -Encoding UTF8
