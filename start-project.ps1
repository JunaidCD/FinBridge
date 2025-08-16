c# FinBridge Project Startup Script
Write-Host "🚀 Starting FinBridge Project..." -ForegroundColor Green

# Start Hardhat Node (Terminal 1)
Write-Host "📡 Starting Hardhat Node..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run node"

# Wait a moment for Hardhat to start
Start-Sleep -Seconds 3

# Start Backend Server (Terminal 2)
Write-Host "🔧 Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start Frontend Client (Terminal 3)
Write-Host "🌐 Starting Frontend Client..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend/client; npm run dev"

Write-Host "✅ All services started!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔗 Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "⛓️  Blockchain: http://localhost:8545" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔑 MetaMask Setup:" -ForegroundColor Yellow
Write-Host "   Network: Hardhat Local" -ForegroundColor White
Write-Host "   RPC URL: http://127.0.0.1:8545" -ForegroundColor White
Write-Host "   Chain ID: 1337" -ForegroundColor White 