# 🔍 Гайд по роботі з Appium Inspector

Appium Inspector — це графічний клієнт, який дозволяє переглядати дерево елементів мобільного додатка (DOM) та знаходити локатори (`accessibilityLabel`, `UiSelector`, `XPath`) для написання автоматизованих тестів.

## 🛠 Підготовка до запуску

Перед тим як відкрити Appium Inspector, переконайтеся, що:
1. Запущений емулятор або підключений фізичний пристрій Android.
2. В окремому вікні термінала запущений сервер Appium (команда `appium`).
3. Ви маєте актуальний збілджений `.apk` файл.

## 🔗 Налаштування підключення (Remote Server)

На головному екрані Inspector у верхньому блоці вкажіть такі параметри:
* **Remote Host:** `127.0.0.1`
* **Remote Port:** `4723`
* **Remote Path:** `/` *(Обов'язково просто коса риска для Appium 2.x!)*

## 📦 JSON Representation (Capabilities)

Щоб не вводити кожен параметр вручну, перейдіть у вкладку **JSON Representation**, натисніть іконку редагування (олівець), вставте цей конфіг і натисніть **Save**:

```json
{
  "platformName": "Android",
  "appium:automationName": "UiAutomator2",
  "appium:deviceName": "emulator-5554",
  "appium:app": "/Users/nazarii/Desktop/University/health-circle/apps/client/android/app/build/outputs/apk/release/app-release.apk",
  "appium:appPackage": "com.healthcircle.app",
  "appium:appWaitActivity": "*",
  "appium:appActivity": ".MainActivity",
  "appium:noReset": false,
  "appium:ensureWebviewsHavePages": true,
  "appium:autoGrantPermissions": true
}
```

> **Лайфхак:** Якщо ви хочете дослідити екран глибоко в додатку (наприклад, Профіль), дійдіть до нього руками на емуляторі, змініть в JSON `"appium:noReset": true` і запустіть сесію. Appium підключиться до поточного екрана без перезавантаження додатка.

## 🚑 Вирішення типових помилок (Troubleshooting)

### 1. `NoSuchDriverError: A session is either terminated or not started`
**Симптоми:** Inspector нескінченно вантажиться або викидає цю помилку одразу після натискання "Start Session".
**Причина:** Баг десктопного клієнта, який намагається достукатися до закритої сесії, або "зависла" сесія на сервері Appium.
**Рішення:**
1. Повністю закрийте Appium Inspector (`Cmd + Q` на Mac).
2. Зупиніть Appium сервер у терміналі (`Ctrl + C`) і запустіть його знову (`appium`).
3. Відкрийте Inspector і почніть сесію.

### 2. `MainActivity never started`
**Симптоми:** Appium встановлює додаток, але падає через таймаут.
**Причина:** React Native / Expo додатки можуть мати нестандартні назви активностей на старті або довго завантажувати JS-бандл.
**Рішення:** Переконайтеся, що в capabilities є параметр `"appium:appWaitActivity": "*"`. Це змусить Appium чекати на появу будь-якого екрана вашого додатка.

### 3. `The application at '...' does not exist`
**Симптоми:** Помилка в перші секунди запуску.
**Причина:** Appium Inspector потребує **абсолютного** шляху до `.apk` файлу на вашому диску. Відносні шляхи (`../`) тут не працюють.
**Рішення:** Перевірте параметр `appium:app` і вкажіть повний шлях, починаючи від `/Users/...`.