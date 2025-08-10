@echo off
echo 🐘 Iniciando pgweb para PostgreSQL...
echo 📊 URL: http://localhost:8081

pgweb.exe --host=localhost --port=5432 --user=postgres --pass=password --db=zaiken_db --bind=0.0.0.0 --listen=8081

pause
