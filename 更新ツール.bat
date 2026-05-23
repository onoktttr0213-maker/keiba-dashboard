@echo off
echo Vercelへのデプロイを開始します...
cd C:\Users\onokt\.gemini\antigravity\scratch\keiba-dashboard
npx vercel --prod --yes
echo デプロイが完了しました！
pause