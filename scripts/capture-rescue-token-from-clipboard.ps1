param(
  [string]$Path = (Join-Path $env:LOCALAPPDATA 'LiveWire\rescue-credentials.json')
)

$ErrorActionPreference = 'Stop'
$token = [string](Get-Clipboard -Raw)
$token = $token.Trim()
if ($token.Length -lt 100) { throw 'Clipboard does not contain a plausible eBay OAuth token.' }
if ($token -match '\s') { throw 'Clipboard token contains whitespace and was not saved.' }

$secure = ConvertTo-SecureString $token -AsPlainText -Force
$parent = Split-Path -Parent $Path
New-Item -ItemType Directory -Force -Path $parent | Out-Null
$payload = [ordered]@{
  schemaVersion = 1
  environment = 'production'
  marketplaceId = 'EBAY_US'
  accessTokenDpapi = ConvertFrom-SecureString $secure
  storedAt = [DateTime]::UtcNow.ToString('o')
}
[System.IO.File]::WriteAllText($Path, ($payload | ConvertTo-Json), [System.Text.UTF8Encoding]::new($false))
$token = $null
$secure.Dispose()
Write-Host 'Encrypted credential saved from clipboard without displaying the token.'
