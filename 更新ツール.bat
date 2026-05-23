@echo off
chcp 65001 >nul
echo データを更新し、自動デプロイ（GitHub経由）を開始します...
cd C:\Users\onokt\.gemini\antigravity\scratch\keiba-dashboard
git add .
git commit -m "データ更新"
git push
echo.
echo デプロイの指示が完了しました！
echo Vercel側で自動的に更新処理が始まり、数分後にサイトに反映されます。
pause