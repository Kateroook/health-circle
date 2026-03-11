export const validatePasswordComplexity = (pass: string): string | null => {
  if (!pass) {
    return "Новий пароль обовʼязковий";
  }

  if (pass.length < 12) {
    return "Новий пароль має містити щонайменше 12 символів";
  }

  const upper = /[A-Z]/.test(pass) ? 1 : 0;
  const lower = /[a-z]/.test(pass) ? 1 : 0;
  const digit = /[0-9]/.test(pass) ? 1 : 0;
  const special = /[;:!@#$%^&()_\-=+]/.test(pass) ? 1 : 0;

  if (upper + lower + digit + special < 3) {
    return "Пароль має містити великі, малі літери, цифри та символи";
  }

  return null;
};

