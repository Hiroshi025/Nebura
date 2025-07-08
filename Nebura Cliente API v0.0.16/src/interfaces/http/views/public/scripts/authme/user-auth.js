document.addEventListener("DOMContentLoaded", function () {
  // --- DICCIONARIO DE TRADUCCIONES ---

  const translations = {
    en: {
      loginTitle: "Sign In",
      loginSubtitle: "Welcome back!",
      registerTitle: "Create Account",
      registerSubtitle: "Join our community!",
      googleBtn: "Continue with Google",
      discordBtn: "Continue with Discord",
      separatorText: "Or with your email",
      emailLabel: "Email",
      emailPlaceholder: "your.email@example.com",
      passwordLabel: "Password",
      passwordPlaceholder: "••••••••••",
      generateBtnTitle: "Generate Secure Password",
      toggleBtnTitle: "Show/Hide Password",
      loginBtn: "Sign In",
      registerBtn: "Create Account",
      rememberMe: "Remember me",
      forgotPassword: "Forgot password?",
      noAccountPrompt: "Don't have an account?",
      hasAccountPrompt: "Already have an account?",
      registerLink: "Sign up",
      loginLink: "Log in",
      termsLabel: "I agree to the",
      termsLink: "Terms of Service",
      privacyLink: "Privacy Policy",
      strength: "Strength",
      strengthLow: "Low",
      strengthMedium: "Medium",
      strengthHigh: "High",
      nameLabel: "Name",
      nameRequiredError: "Name is required",
      strengthSecure: "Secure",
      themeChangeTitle: "Change theme",
      emailRequiredError: "Email is required",
      invalidEmailError: "Please enter a valid email",
      passwordRequiredError: "Password is required",
      termsRequiredError: "You must accept the terms",
      loginError: "Invalid email or password",
      registerError: "Error creating account",
      discordRecommend:
        "It is recommended to sign in with <strong>Discord</strong> for a better experience.",
      discordLabel: "Discord ID",
    },
    es: {
      loginTitle: "Iniciar Sesión",
      loginSubtitle: "¡Bienvenido de nuevo!",
      registerTitle: "Crear Cuenta",
      registerSubtitle: "¡Únete a nuestra comunidad!",
      googleBtn: "Continuar con Google",
      discordBtn: "Continuar con Discord",
      separatorText: "O con tu email",
      emailLabel: "Email",
      emailPlaceholder: "tu.email@ejemplo.com",
      passwordLabel: "Contraseña",
      passwordPlaceholder: "••••••••••",
      generateBtnTitle: "Generar Contraseña Segura",
      toggleBtnTitle: "Mostrar/Ocultar Contraseña",
      loginBtn: "Iniciar Sesión",
      registerBtn: "Crear Cuenta",
      rememberMe: "Recordarme",
      forgotPassword: "¿Olvidaste tu contraseña?",
      noAccountPrompt: "¿No tienes una cuenta?",
      hasAccountPrompt: "¿Ya tienes una cuenta?",
      registerLink: "Regístrate",
      loginLink: "Inicia Sesión",
      nameLabel: "Nombre",
      nameRequiredError: "El nombre es requerido",
      termsLabel: "Acepto los",
      termsLink: "Términos de Servicio",
      privacyLink: "Política de Privacidad",
      strength: "Seguridad",
      strengthLow: "Baja",
      strengthMedium: "Media",
      strengthHigh: "Alta",
      strengthSecure: "Segura",
      themeChangeTitle: "Cambiar tema",
      emailRequiredError: "El email es requerido",
      invalidEmailError: "Por favor ingresa un email válido",
      passwordRequiredError: "La contraseña es requerida",
      termsRequiredError: "Debes aceptar los términos",
      loginError: "Email o contraseña incorrectos",
      registerError: "Error al crear la cuenta",
      discordRecommend:
        "Se recomienda iniciar sesión por medio de <strong>Discord</strong> para una mejor experiencia.",
      discordLabel: "ID de Discord",
    },
  };

  // --- ELEMENTOS DEL DOM ---
  const themeSwitch = document.getElementById("themeSwitch");
  const themeIcon = document.querySelector('label[for="themeSwitch"] i');
  const htmlElement = document.documentElement;
  const langLinks = document.querySelectorAll(".lang-link");

  // Formularios

  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const loginToggleBtn = document.getElementById("login-toggle-btn");
  const registerToggleBtn = document.getElementById("register-toggle-btn");
  const switchToRegister = document.getElementById("switch-to-register");
  const switchToLogin = document.getElementById("switch-to-login");
  const formMainTitle = document.getElementById("form-main-title");
  const formSubtitle = document.getElementById("form-subtitle");
  const formFooter = document.getElementById("form-footer");

  // Campos de login

  const loginEmail = document.getElementById("login-email");
  const loginPassword = document.getElementById("login-password");
  const toggleLoginPassword = document.getElementById("toggle-login-password");
  const loginEmailError = document.getElementById("login-email-error");
  const loginPasswordError = document.getElementById("login-password-error");

  // Campos de registro

  const registerName = document.getElementById("register-name");
  const registerNameError = document.getElementById("register-name-error");
  const registerDiscordId = document.getElementById("register-discord");
  const registerDiscordAvatar = document.getElementById("register-discord-error");
  const registerEmail = document.getElementById("register-email");
  const registerPassword = document.getElementById("register-password");
  const toggleRegisterPassword = document.getElementById("toggle-register-password");
  const generatePassword = document.getElementById("generate-password");
  const registerEmailError = document.getElementById("register-email-error");
  const registerPasswordError = document.getElementById("register-password-error");
  const termsError = document.getElementById("terms-error");
  const termsCheck = document.getElementById("terms-check");

  // Medidor de contraseña

  const strengthBar = document.getElementById("password-strength-bar");
  const strengthText = document.getElementById("password-strength-text");

  // --- FUNCIONES DE AYUDA ---

  const setLanguage = (lang) => {
    const currentTranslations = translations[lang];
    document.querySelectorAll("[data-key]").forEach((elem) => {
      const key = elem.getAttribute("data-key");
      if (currentTranslations[key]) {
        // Si el texto contiene HTML (como la alerta), usar innerHTML
        if (key === "discordRecommend") {
          elem.innerHTML = `<i class="fab fa-discord me-2"></i>${currentTranslations[key]}`;
        } else {
          elem.textContent = currentTranslations[key];
        }
      }
    });

    // Actualizar atributos que no son textContent

    document.documentElement.lang = lang;
    loginEmail.placeholder = currentTranslations.emailPlaceholder;
    loginPassword.placeholder = currentTranslations.passwordPlaceholder;
    registerEmail.placeholder = currentTranslations.emailPlaceholder;
    registerPassword.placeholder = currentTranslations.passwordPlaceholder;
    generatePassword.title = currentTranslations.generateBtnTitle;
    toggleLoginPassword.title = currentTranslations.toggleBtnTitle;
    toggleRegisterPassword.title = currentTranslations.toggleBtnTitle;
    themeSwitch.title = currentTranslations.themeChangeTitle;

    // Actualizar clase activa del link de idioma

    langLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("data-lang") === lang);
    });

    // Forzar actualización del medidor de contraseña para traducir el texto

    registerPassword.dispatchEvent(new Event("input"));
    localStorage.setItem("language", lang);
  };
  const updateThemeIcon = (theme) => {
    themeIcon.classList.toggle("fa-moon", theme === "light");
    themeIcon.classList.toggle("fa-sun", theme === "dark");
  };

  const applyTheme = (theme) => {
    htmlElement.setAttribute("data-bs-theme", theme);
    themeSwitch.checked = theme === "dark";
    updateThemeIcon(theme);
  };

  const showForm = (formId) => {
    // Ocultar todos los formularios
    document.querySelectorAll(".auth-form").forEach((form) => {
      form.classList.remove("active");
    });

    // Mostrar el formulario seleccionado

    document.getElementById(formId).classList.add("active");

    // Actualizar botones toggle

    document.querySelectorAll(".form-toggle-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-form") === formId);
    });

    // Actualizar títulos y enlace de pie de formulario

    const lang = localStorage.getItem("language") || "es";
    if (formId === "login-form") {
      formMainTitle.textContent = translations[lang].loginTitle;
      formSubtitle.textContent = translations[lang].loginSubtitle;
      formFooter.innerHTML = `<small class="text-muted"><span data-key="noAccountPrompt">${translations[lang].noAccountPrompt}</span> <a href="#" id="switch-to-register" data-key="registerLink">${translations[lang].registerLink}</a></small>`;

      document.getElementById("switch-to-register").addEventListener("click", (e) => {
        e.preventDefault();
        showForm("register-form");
      });
    } else {
      formMainTitle.textContent = translations[lang].registerTitle;
      formSubtitle.textContent = translations[lang].registerSubtitle;
      formFooter.innerHTML = `<small class="text-muted"><span data-key="hasAccountPrompt">${translations[lang].hasAccountPrompt}</span> <a href="#" id="switch-to-login" data-key="loginLink">${translations[lang].loginLink}</a></small>`;

      document.getElementById("switch-to-login").addEventListener("click", (e) => {
        e.preventDefault();
        showForm("login-form");
      });
    }
  };
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const checkPasswordStrength = (password) => {
    const lang = localStorage.getItem("language") || "es";
    let score = 0;
    let feedback = { textKey: "", className: "", width: "0%" };

    if (password.length > 0) {
      const checks = {
        length: password.length >= 8,
        longLength: password.length >= 12,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        symbol: /[^A-Za-z0-9]/.test(password),
      };
      score = Object.values(checks).filter(Boolean).length;
    }

    switch (score) {
      case 0:
      case 1:
      case 2:
        feedback = { textKey: "strengthLow", className: "low", width: "25%" };
        break;
      case 3:
        feedback = { textKey: "strengthMedium", className: "medium", width: "50%" };
        break;
      case 4:
      case 5:
        feedback = { textKey: "strengthHigh", className: "high", width: "75%" };
        break;
      case 6:
        feedback = { textKey: "strengthSecure", className: "secure", width: "100%" };
        break;
    }

    if (password.length === 0) {
      strengthBar.style.width = "0%";
      strengthText.textContent = "";
      strengthBar.className = "";
      strengthText.className = "form-text mt-1 text-end";
    } else {
      strengthBar.style.width = feedback.width;
      strengthBar.className = feedback.className;

      const strengthLabel = translations[lang].strength;
      const strengthValue = translations[lang][feedback.textKey];
      strengthText.textContent = `${strengthLabel}: ${strengthValue}`;
      strengthText.className = `form-text mt-1 text-end ${feedback.className}`;
    }
  };

  const showError = (element, message) => {
    element.textContent = message;
    element.classList.add("show-error");

    setTimeout(() => {
      element.classList.remove("show-error");
    }, 5000);
  };

  const clearErrors = () => {
    document.querySelectorAll(".error-message").forEach((el) => {
      el.textContent = "";
      el.classList.remove("show-error");
    });
  };

  const generateRandomPassword = () => {
    const charset = {
      lowercase: "abcdefghijklmnopqrstuvwxyz",
      uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      numbers: "0123456789",
      symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
    };
    const length = 14;
    let password = "";

    password += charset.lowercase[Math.floor(Math.random() * charset.lowercase.length)];
    password += charset.uppercase[Math.floor(Math.random() * charset.uppercase.length)];
    password += charset.numbers[Math.floor(Math.random() * charset.numbers.length)];
    password += charset.symbols[Math.floor(Math.random() * charset.symbols.length)];

    const allChars = Object.values(charset).join("");

    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    password = password
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("");
    return password;
  };

  // --- MANEJADORES DE EVENTOS ---

  langLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const selectedLang = link.getAttribute("data-lang");
      setLanguage(selectedLang);
    });
  });

  themeSwitch.addEventListener("change", () => {
    const newTheme = themeSwitch.checked ? "dark" : "light";
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  });

  // Alternar entre formularios

  loginToggleBtn.addEventListener("click", () => showForm("login-form"));
  registerToggleBtn.addEventListener("click", () => showForm("register-form"));
  switchToRegister?.addEventListener("click", (e) => {
    e.preventDefault();
    showForm("register-form");
  });

  // Mostrar/ocultar contraseña en login

  toggleLoginPassword.addEventListener("click", () => {
    const isPassword = loginPassword.type === "password";
    loginPassword.type = isPassword ? "text" : "password";
    const icon = toggleLoginPassword.querySelector("i");
    icon.classList.toggle("fa-eye");
    icon.classList.toggle("fa-eye-slash");
  });

  // Mostrar/ocultar contraseña en registro

  toggleRegisterPassword.addEventListener("click", () => {
    const isPassword = registerPassword.type === "password";
    registerPassword.type = isPassword ? "text" : "password";
    const icon = toggleRegisterPassword.querySelector("i");
    icon.classList.toggle("fa-eye");
    icon.classList.toggle("fa-eye-slash");
  });

  // Generar contraseña segura

  generatePassword.addEventListener("click", () => {
    const password = generateRandomPassword();
    registerPassword.value = password;
    checkPasswordStrength(password);
  });

  // Medidor de fortaleza de contraseña

  registerPassword.addEventListener("input", () => {
    checkPasswordStrength(registerPassword.value);
  });

  // Validación del formulario de login

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();
    const lang = localStorage.getItem("language") || "es";
    let isValid = true;

    // Validar email
    if (!loginEmail.value.trim()) {
      showError(loginEmailError, translations[lang].emailRequiredError);
      isValid = false;
    } else if (!validateEmail(loginEmail.value.trim())) {
      showError(loginEmailError, translations[lang].invalidEmailError);
      isValid = false;
    }

    // Validar contraseña
    if (!loginPassword.value.trim()) {
      showError(loginPasswordError, translations[lang].passwordRequiredError);
      isValid = false;
    }

    if (isValid) {
      try {
        const response = await fetch("/dashboard/utils/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: loginEmail.value.trim(),
            password: loginPassword.value,
          }),
        });

        if (response.ok) {
          window.location.href = "/dashboard";
        } else {
          showError(loginPasswordError, translations[lang].loginError);
        }
      } catch (error) {
        console.error("Error:", error);
        showError(loginPasswordError, translations[lang].loginError);
      }
    }
  });

  // Validación del formulario de registro
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const lang = localStorage.getItem("language") || "es";
    let isValid = true;

    if (!registerName.value.trim()) {
      showError(
        registerNameError,
        translations[lang].nameRequiredError || "El nombre es requerido",
      );
      isValid = false;
    }

    // Validar email
    if (!registerEmail.value.trim()) {
      showError(registerEmailError, translations[lang].emailRequiredError);
      isValid = false;
    } else if (!validateEmail(registerEmail.value.trim())) {
      showError(registerEmailError, translations[lang].invalidEmailError);
      isValid = false;
    }
    // Validar contraseña
    if (!registerPassword.value.trim()) {
      showError(registerPasswordError, translations[lang].passwordRequiredError);
      isValid = false;
    }

    // Validar términos
    if (!termsCheck.checked) {
      showError(termsError, translations[lang].termsRequiredError);
      isValid = false;
    }

    if (isValid) {
      try {
        const response = await fetch("/dashboard/utils/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: registerName.value.trim(),
            email: registerEmail.value.trim(),
            password: registerPassword.value,
            discordId: registerDiscordId.value.trim(),
          }),
        });

        if (response.ok) {
          window.location.href = "/dashboard";
        } else {
          const errorData = await response.json();
          showError(registerEmailError, errorData.message || translations[lang].registerError);
        }
      } catch (error) {
        console.error("Error:", error);
        showError(registerEmailError, translations[lang].registerError);
      }
    }
  });

  // --- INICIALIZACIÓN ---
  const savedTheme =
    localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(savedTheme);

  const savedLang =
    localStorage.getItem("language") || (navigator.language.startsWith("en") ? "en" : "es");
  setLanguage(savedLang);

  // Mostrar el formulario de login por defecto
  showForm("login-form");
});
