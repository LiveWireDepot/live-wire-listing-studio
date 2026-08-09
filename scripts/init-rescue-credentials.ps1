param(
  [string]$Path = (Join-Path $env:LOCALAPPDATA 'LiveWire\rescue-credentials.json')
)

$ErrorActionPreference = 'Stop'
$parent = Split-Path -Parent $Path
New-Item -ItemType Directory -Force -Path $parent | Out-Null

Write-Host 'Live Wire local eBay Production authorization'
Write-Host 'Paste the Production OAuth user access token below. It will not be displayed.'
$secureToken = Read-Host 'Production user access token' -AsSecureString
if ($secureToken.Length -lt 20) { throw 'The token was empty or unexpectedly short.' }

$payload = [ordered]@{
  schemaVersion = 1
  environment = 'production'
  marketplaceId = 'EBAY_US'
  accessTokenDpapi = ConvertFrom-SecureString $secureToken
  storedAt = [DateTime]::UtcNow.ToString('o')
}
$json = $payload | ConvertTo-Json
[System.IO.File]::WriteAllText($Path, $json, [System.Text.UTF8Encoding]::new($false))
Write-Host "Encrypted credential saved for the current Windows user."
Write-Host "Return to Codex and say: AUTHORIZED LOCALLY"
