import { $, expect } from '@wdio/globals';

describe('Test basic flow', () => {

    it('should navigate to registration page and verify instructions text', async () => {
        // 1. Знаходимо кнопку "Зареєструватися" за описом (content-desc / accessibilityLabel)
        // Використовуємо стратегію 'android=' для нативних селекторів UiSelector
        const registerButton = await $('android=new UiSelector().description("Зареєструватися")');

        // Чекаємо, поки кнопка з'явиться (на випадок довгого завантаження Splash screen)
        await registerButton.waitForDisplayed({ timeout: 10000 });
        
        // 2. Натискаємо на кнопку
        await registerButton.click();

        // 3. Знаходимо текст на новій сторінці за точним збігом тексту
        const instructionText = await $('android=new UiSelector().text("Введи номер телефону та електронну пошту")');

        // 4. Перевіряємо, що текст відображається на екрані
        // WDIO автоматично почекає появи елемента перед асертом
        await expect(instructionText).toBeDisplayed();
        
        // Додатково можна перевірити, чи текст саме такий, як ми очікуємо
        await expect(instructionText).toHaveText('Введи номер телефону та електронну пошту');
    });
});