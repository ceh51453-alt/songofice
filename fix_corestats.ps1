$files = @(
  "e:\iceandfire\src\content\westeros\eras\aegonConquest.ts",
  "e:\iceandfire\src\content\westeros\eras\blackfyreRebellion.ts",
  "e:\iceandfire\src\content\westeros\eras\danceOfDragons.ts",
  "e:\iceandfire\src\content\westeros\eras\dunkAndEgg.ts",
  "e:\iceandfire\src\content\westeros\eras\robertsRebellion.ts"
)
foreach ($f in $files) {
  $content = Get-Content $f -Raw -Encoding UTF8
  $content = $content -replace '\bSTR:', '"S`u{1EE9}c M`u{1EA1}nh":'
  $content = $content -replace '\bAGI:', '"Nhanh Nh`u{1EB9}n":'
  $content = $content -replace '\bEND:', '"Th`u{1EC3} Ch`u{1EA5}t":'
  $content = $content -replace '\bINT:', '"Tr`u{00ED} Tu`u{1EC7}":'
  $content = $content -replace '\bWIL:', '"Tinh T`u{01B0}`u{1EDD}ng":'
  $content = $content -replace '\bCHA:', '"Uy T`u{00ED}n":'
  [System.IO.File]::WriteAllText($f, $content, [System.Text.Encoding]::UTF8)
  Write-Host "Fixed CoreStat keys in: $f"
}
