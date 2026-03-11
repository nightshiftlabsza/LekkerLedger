param(
    [Parameter(Mandatory=$true)][string]$DocxPath,
    [Parameter(Mandatory=$true)][string]$OutPath
)

$ErrorActionPreference = "Stop"
$extractedPath = "$env:TEMP\docx_ext_$([guid]::NewGuid())"

Write-Host "Extracting '$DocxPath' to '$extractedPath'"
Expand-Archive -Path $DocxPath -DestinationPath $extractedPath -Force

$xmlPath = "$extractedPath\word\document.xml"
# Note: document.xml might not have BOM, raw reading as string
$xmlContent = [System.IO.File]::ReadAllText($xmlPath)
$xml = [xml]$xmlContent

$nsPrefix = @{w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
$paragraphs = Select-Xml -Xml $xml -XPath "//w:p" -Namespace $nsPrefix

$outLines = @()
foreach ($p in $paragraphs) {
    $texts = Select-Xml -Xml $p.Node -XPath ".//w:t" -Namespace $nsPrefix
    if ($texts) {
        $lineText = ($texts | ForEach-Object { $_.Node.InnerText }) -join ""
        if (-not [string]::IsNullOrWhiteSpace($lineText)) {
            $outLines += $lineText
        }
    }
}

$outLines | Out-File -FilePath $OutPath -Encoding utf8
Remove-Item -Recurse -Force $extractedPath
Write-Host "Saved to $OutPath"
