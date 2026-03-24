## 🚀 Mobile Test Automation Setup Guide

Цей гайд допоможе налаштувати середовище для запуску мобільних тестів (WebdriverIO + Appium + Android).

### 1. Базове ПЗ (Спільне)
Перш за все, переконайтеся, що у вас встановлені ці інструменти:
* **Node.js**: Версія 18+, рекомендовано **LTS 22**.
* **Java JDK**: Рекомендовано **OpenJDK 17**.
    * *Windows*: Встановити через [Chocolatey](https://chocolatey.org/) (`choco install openjdk17`) або завантажити з сайту Oracle.
    * *macOS*: `brew install openjdk@17`.

---

### 2. Android Studio & SDK
Нам потрібна не сама IDE, а інструменти, які йдуть з нею.
1.  Встановіть **Android Studio**.
2.  Відкрийте **SDK Manager** (Settings -> Languages & Frameworks -> Android SDK).
3.  У вкладці **SDK Tools** обов'язково позначте:
    * `Android SDK Build-Tools`
    * `Android SDK Command-line Tools (latest)` — **Критично!**
    * `Android Emulator`
    * `Android SDK Platform-Tools` (це наш `adb`)

---

### 3. Змінні оточення (Environment Variables)
Це найважливіший етап. Система має знати, де шукати Android SDK та Java.

#### 🍏 Для macOS (zsh)
Додайте в `~/.zshrc`:
```bash
export JAVA_HOME=$(/usr/libexec/java_home)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$JAVA_HOME/bin
```
Потім: `source ~/.zshrc`.

#### 🪟 Для Windows
1.  **ANDROID_HOME**: Створіть системну змінну `ANDROID_HOME` зі шляхом `C:\Users\<USER>\AppData\Local\Android\Sdk`.
2.  **JAVA_HOME**: Створіть системну змінну `JAVA_HOME` зі шляхом до папки JDK.
3.  **Path**: Додайте в змінну `Path` такі записи:
    * `%ANDROID_HOME%\platform-tools`
    * `%ANDROID_HOME%\emulator`
    * `%ANDROID_HOME%\cmdline-tools\latest\bin`
    * `%JAVA_HOME%\bin`

---

### 4. Appium Setup
Встановлюємо серце нашої автоматизації:
```bash
# Встановлення Appium сервера
npm install -g appium

# Встановлення драйвера для Android
appium driver install uiautomator2
```

---

### 5. Підготовка пристрою (Android)
1.  **Режим розробника**: На телефоні зайдіть у "Налаштування" -> "Про телефон" -> натисніть 7 разів на "Номер збірки".
2.  **USB Debugging**: У "Параметрах розробника" увімкніть "Налагодження по USB".
3.  **Перевірка**: Підключіть кабель і введіть у терміналі `adb devices`. Ви маєте побачити ID свого пристрою.

---

### 6. Перевірка (The Moment of Truth)
Встановіть та запустіть `appium-doctor`, щоб переконатися, що все зелене:
```bash
npm install -g @appium/doctor
appium-doctor --android
```
> **Примітка:** Якщо доктор каже, що не знайдено `android` або `apkanalyzer` — це нормально для нових версій SDK, якщо `adb` та `cmdline-tools` позначені як знайдені.

---

### 7. Запуск проєкту
1.  `npm install` у папці нашого тестового фреймворку.
2.  Вставте `.apk` файл у папку, вказану в `wdio.conf.ts`.
3.  Запуск: `npm run test:mobile`.

---

### Поради:
* **Версії Node.js**: Якщо використовуєте `nvm`, переконайтеся, що Appium встановлений саме в тій версії Node, яку ви використовуєте для проєкту.
* **Кабель**: Використовуйте якісний кабель для підключення Android, інакше `adb` буде постійно "відпадати".
* **Емулятори**: Якщо хочете створити емулятор, це робиться в Android Studio через **Device Manager**.