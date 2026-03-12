$files = Get-ChildItem -Path "d:\nexprism\Dnd-Ecommerce\src" -Include *.tsx,*.jsx -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName | Out-String
    $newContent = $content -replace 'greenOne', 'greenOne'
    if ($content -ne $newContent) {
        $newContent | Set-Content -Path $file.FullName -NoNewline
        Write-Host "Updated: $($file.Name)"
    }
}

Write-Host "`nReplacement complete!"
