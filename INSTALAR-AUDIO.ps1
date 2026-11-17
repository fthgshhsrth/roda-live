$ErrorActionPreference='Stop'
Write-Host 'Instalando yt-dlp e FFmpeg pelo winget. Reabra o servidor ao concluir.'
winget install --id yt-dlp.yt-dlp --exact --accept-package-agreements --accept-source-agreements
if($LASTEXITCODE -ne 0){Write-Warning 'Confira a instalação do yt-dlp.'}
winget install --id Gyan.FFmpeg --exact --accept-package-agreements --accept-source-agreements
if($LASTEXITCODE -ne 0){Write-Warning 'Confira a instalação do FFmpeg.'}