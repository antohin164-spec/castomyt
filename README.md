# YT Custom Client (iOS IPA Builder)

Готовый проект кастомного YouTube-клиента без рекламы на базе React + Capacitor с автоматической сборкой неподписанного `.ipa` через GitHub Actions (для установки через AltStore, Sideloadly, TrollStore или Scarlet).

## Как собрать `.ipa`:
1. Создайте новый репозиторий на GitHub.
2. Загрузите все файлы из этого архива в корень репозитория (ветка `main`).
3. Перейдите во вкладку **Actions** в репозитории GitHub — сборка запустится автоматически.
4. После завершения откройте завершённый workflow и скачайте архив **YT-Custom-IPA** из блока **Artifacts**.
5. Внутри архива находится готовый файл `YT-Custom-Unsigned.ipa`.
