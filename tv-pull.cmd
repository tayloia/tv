@echo off
node tv-pull.js >tv-data.js
start chrome file://%CD%\tv.html?movies