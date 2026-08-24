@echo off

rem 打包Flask应用为可执行文件
pyinstaller --onefile --add-data "templates;templates" app.py

echo 打包完成！
echo 可执行文件位于 dist\app.exe
pause