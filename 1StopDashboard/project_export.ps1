# project_export.ps1

$outputFile = "project_export.txt"

# Clear or create the output file
"# Complete Project Export" | Out-File -FilePath $outputFile
"Generated on $(Get-Date)" | Out-File -FilePath $outputFile -Append
"" | Out-File -FilePath $outputFile -Append

# Directory structure section
"## Directory Structure" | Out-File -FilePath $outputFile -Append
"" | Out-File -FilePath $outputFile -Append
"```" | Out-File -FilePath $outputFile -Append

Get-ChildItem -Recurse -Directory | 
Where-Object { 
    (-not $_.FullName.Contains("node_modules")) -and 
    (-not $_.FullName.Contains(".git")) 
} | 
ForEach-Object { 
    $depth = ($_.FullName.Split("\").Count - $PWD.Path.Split("\").Count)
    $indent = "  " * $depth 
    "$indent└── $($_.Name)" 
} | Out-File -FilePath $outputFile -Append

"```" | Out-File -FilePath $outputFile -Append
"" | Out-File -FilePath $outputFile -Append

# File contents section
"## File Contents" | Out-File -FilePath $outputFile -Append
"" | Out-File -FilePath $outputFile -Append

$binaryExtensions = @(".jpg", ".png", ".ico", ".svg", ".ttf", ".woff", ".woff2", ".eot", ".mp4", ".mp3", ".pdf")

Get-ChildItem -Recurse -File | 
Where-Object { 
    (-not $_.FullName.Contains("node_modules")) -and 
    (-not $_.FullName.Contains(".git")) -and 
    ($binaryExtensions -notcontains $_.Extension)
} | 
ForEach-Object { 
    $relativePath = $_.FullName.Substring($PWD.Path.Length + 1)
    
    # Add file header with path
    "### File: $relativePath" | Out-File -FilePath $outputFile -Append
    "" | Out-File -FilePath $outputFile -Append
    
    # Determine language for syntax highlighting based on extension
    $extension = $_.Extension
    $lang = switch ($extension) {
        ".js" { "javascript" }
        ".jsx" { "javascript" }
        ".ts" { "typescript" }
        ".tsx" { "typescript" }
        ".html" { "html" }
        ".css" { "css" }
        ".scss" { "scss" }
        ".json" { "json" }
        ".md" { "markdown" }
        ".py" { "python" }
        default { "" }
    }
    
    # Add file content with code fence
    "```$lang" | Out-File -FilePath $outputFile -Append
    
    try {
        Get-Content $_.FullName -Raw | Out-File -FilePath $outputFile -Append -ErrorAction Stop
    } 
    catch {
        "Unable to read file content: $_" | Out-File -FilePath $outputFile -Append
    }
    
    "```" | Out-File -FilePath $outputFile -Append
    "" | Out-File -FilePath $outputFile -Append
    "---" | Out-File -FilePath $outputFile -Append
    "" | Out-File -FilePath $outputFile -Append
}

Write-Host "Export complete! Output saved to $outputFile"