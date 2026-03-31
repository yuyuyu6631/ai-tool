$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
$OutputRoot = Join-Path $RepoRoot "output/demo"
$RawVideo = Join-Path $OutputRoot "system-demo-raw.webm"
$SubtitleFile = Join-Path $OutputRoot "system-demo.srt"
$ShiftedSubtitleFile = Join-Path $OutputRoot "system-demo-shifted.srt"
$ScriptFile = Join-Path $OutputRoot "demo-script.md"
$IntroVideo = Join-Path $OutputRoot "intro.mp4"
$MainVideo = Join-Path $OutputRoot "main.mp4"
$ConcatFile = Join-Path $OutputRoot "concat.txt"
$FinalVideo = Join-Path $OutputRoot "system-demo-final.mp4"

New-Item -ItemType Directory -Force -Path $OutputRoot | Out-Null

function Assert-LastExitCode {
  param([string]$Step)
  if ($LASTEXITCODE -ne 0) {
    throw "$Step failed with exit code $LASTEXITCODE"
  }
}

function Convert-ToMilliseconds {
  param([string]$Timestamp)
  $parts = $Timestamp -split '[:,]'
  return ([int]$parts[0] * 3600000) + ([int]$parts[1] * 60000) + ([int]$parts[2] * 1000) + [int]$parts[3]
}

function Convert-ToSrtTimestamp {
  param([int]$Milliseconds)
  $hours = [int][math]::Floor($Milliseconds / 3600000)
  $minutes = [int][math]::Floor(($Milliseconds % 3600000) / 60000)
  $seconds = [int][math]::Floor(($Milliseconds % 60000) / 1000)
  $ms = [int]($Milliseconds % 1000)
  return ("{0:D2}:{1:D2}:{2:D2},{3:D3}" -f $hours, $minutes, $seconds, $ms)
}

$scriptText = @"
# 系统演示文案

## 视频定位
用于系统演示的成片，重点展示首页入口、草稿目录检索、详情审核视角和二次筛选能力。

## 镜头文案
1. 这里是星点评首页，用户先看到聚合入口和精选内容。
2. 演示切换到草稿数据集后，目录立即扩展为完整待审工具库。
3. 通过关键词检索，可以在两千多条草稿中快速定位目标工具。
4. 进入详情页后，摘要、状态、标签和同类工具会集中呈现，方便审核判断。
5. 回到列表后，还能继续做分类、标签和排序筛选，适合内容运营和发布前检查。

## 成片说明
- 原始录制：Playwright 浏览器自动演示
- 后期处理：FFmpeg 片头拼接 + 字幕烧录
- 输出比例：16:9
"@

Set-Content -LiteralPath $ScriptFile -Value $scriptText -Encoding UTF8

$subtitleLines = Get-Content -LiteralPath $SubtitleFile
$shiftedLines = foreach ($line in $subtitleLines) {
  if ($line -match '^(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})$') {
    $start = Convert-ToMilliseconds $matches[1]
    $end = Convert-ToMilliseconds $matches[2]
    "$(Convert-ToSrtTimestamp ($start + 3000)) --> $(Convert-ToSrtTimestamp ($end + 3000))"
  } else {
    $line
  }
}
Set-Content -LiteralPath $ShiftedSubtitleFile -Value $shiftedLines -Encoding UTF8

Push-Location $OutputRoot

ffmpeg -y -hide_banner `
  -f lavfi -i color=c=#0f172a:s=1600x900:d=3 `
  -c:v libx264 -pix_fmt yuv420p "intro.mp4"
Assert-LastExitCode "Generate intro"

ffmpeg -y -hide_banner `
  -i "system-demo-raw.webm" `
  -c:v libx264 -preset medium -crf 22 -pix_fmt yuv420p `
  "main.mp4"
Assert-LastExitCode "Convert main video"

$concatText = @"
file 'intro.mp4'
file 'main.mp4'
"@
Set-Content -LiteralPath $ConcatFile -Value $concatText -Encoding ASCII

ffmpeg -y -hide_banner `
  -f concat -safe 0 -i "concat.txt" `
  -c:v libx264 -preset medium -crf 22 `
  "system-demo-final.mp4"
Assert-LastExitCode "Render final video"

Pop-Location

Write-Output $FinalVideo
