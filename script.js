document.addEventListener('DOMContentLoaded', function() {
    // Fonction pour afficher les messages d'erreur
    function showError(inputElement, message) {
        const errorElement = inputElement.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            inputElement.style.borderColor = '#ff6b6b';
        }
    }

    // Fonction pour cacher les erreurs
    function hideError(inputElement) {
        const errorElement = inputElement.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.style.display = 'none';
            inputElement.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        }
    }

    // Gestion améliorée de l'affichage/masquage du mot de passe (version optimisée)
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target') || 
                           this.parentElement.querySelector('input').id;
            const input = document.getElementById(targetId);
            
            if (input.type === 'password') {
                input.type = 'text';
                this.classList.replace('bx-hide', 'bx-show');
                this.setAttribute('aria-label', 'Masquer le mot de passe');
            } else {
                input.type = 'password';
                this.classList.replace('bx-show', 'bx-hide');
                this.setAttribute('aria-label', 'Afficher le mot de passe');
            }
            
            // Animation fluide
            this.style.transform = 'translateY(-50%) scale(0.8)';
            setTimeout(() => {
                this.style.transform = 'translateY(-50%) scale(1)';
            }, 100);
            
            // Focus sur le champ
            input.focus();
        });
    });

    // Gestion améliorée du formulaire d'inscription
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        // Validation en temps réel
        const registerUsername = document.getElementById('registerUsername');
        const registerEmail = document.getElementById('registerEmail');
        const registerPassword = document.getElementById('registerPassword');
        const confirmPassword = document.getElementById('confirmPassword');

        [registerUsername, registerEmail, registerPassword, confirmPassword].forEach(input => {
            input.addEventListener('input', function() {
                hideError(this);
            });
        });

        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            let isValid = true;
            
            const username = registerUsername.value.trim();
            const email = registerEmail.value.trim();
            const password = registerPassword.value;
            const confirmPass = confirmPassword.value;
            
            // Validation du nom d'utilisateur
            if (username.length < 4) {
                showError(registerUsername, 'Le nom d\'utilisateur doit contenir au moins 4 caractères');
                isValid = false;
            }
            
            // Validation de l'email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showError(registerEmail, 'Veuillez entrer une adresse email valide');
                isValid = false;
            }
            
            // Validation du mot de passe
            if (password.length < 6) {
                showError(registerPassword, 'Le mot de passe doit contenir au moins 6 caractères');
                isValid = false;
            }
            
            // Confirmation du mot de passe
            if (password !== confirmPass) {
                showError(confirmPassword, 'Les mots de passe ne correspondent pas');
                isValid = false;
            }
            
            if (!isValid) {
                registerForm.classList.add('shake');
                setTimeout(() => registerForm.classList.remove('shake'), 500);
                return;
            }
            
            // Vérifier si l'utilisateur existe déjà
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const userExists = users.some(user => user.username === username);
            const emailExists = users.some(user => user.email === email);
            
            if (userExists) {
                showError(registerUsername, 'Ce nom d\'utilisateur est déjà pris');
                registerForm.classList.add('shake');
                setTimeout(() => registerForm.classList.remove('shake'), 500);
                return;
            }
            
            if (emailExists) {
                showError(registerEmail, 'Cet email est déjà utilisé');
                registerForm.classList.add('shake');
                setTimeout(() => registerForm.classList.remove('shake'), 500);
                return;
            }
            
            // Enregistrer le nouvel utilisateur
            users.push({ 
                username, 
                email, 
                password, // Note: En production, utilisez toujours un hachage de mot de passe
                joined: new Date().toISOString() 
            });
            
            localStorage.setItem('users', JSON.stringify(users));
            
            // Message de succès avec timeout
            const submitButton = registerForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Inscription réussie !';
            submitButton.style.backgroundColor = '#4BB543';
            submitButton.disabled = true;
            
            setTimeout(() => {
                submitButton.textContent = originalText;
                submitButton.style.backgroundColor = '';
                submitButton.disabled = false;
                window.location.href = 'index.html';
            }, 1500);
        });
    }

    // Gestion améliorée du formulaire de connexion
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const loginUsername = document.getElementById('loginUsername');
        const loginPassword = document.getElementById('loginPassword');
        
        [loginUsername, loginPassword].forEach(input => {
            input.addEventListener('input', function() {
                hideError(this);
            });
        });

        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            let isValid = true;
            
            const username = loginUsername.value.trim();
            const password = loginPassword.value;
            
            // Validation basique
            if (username.length === 0) {
                showError(loginUsername, 'Veuillez entrer un nom d\'utilisateur');
                isValid = false;
            }
            
            if (password.length === 0) {
                showError(loginPassword, 'Veuillez entrer un mot de passe');
                isValid = false;
            }
            
            if (!isValid) {
                loginForm.classList.add('shake');
                setTimeout(() => loginForm.classList.remove('shake'), 500);
                return;
            }
            
            // Vérifier les informations de connexion
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(user => user.username === username && user.password === password);
            
            if (user) {
                // Stocker l'utilisateur connecté
                localStorage.setItem('currentUser', JSON.stringify(user));
                
                // Animation de succès
                const submitButton = loginForm.querySelector('button[type="submit"]');
                const originalText = submitButton.textContent;
                submitButton.textContent = 'Connexion réussie !';
                submitButton.style.backgroundColor = '#4BB543';
                submitButton.disabled = true;
                
                setTimeout(() => {
                    submitButton.textContent = originalText;
                    submitButton.style.backgroundColor = '';
                    submitButton.disabled = false;
                    window.location.href = 'home.html';
                }, 1500);
            } else {
                showError(loginUsername, 'Identifiants incorrects');
                showError(loginPassword, 'Identifiants incorrects');
                
                // Animation d'erreur
                loginForm.classList.add('shake');
                setTimeout(() => {
                    loginForm.classList.remove('shake');
                }, 500);
            }
        });
    }
});