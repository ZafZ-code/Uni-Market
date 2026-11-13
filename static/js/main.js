document.addEventListener('DOMContentLoaded', () => {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const STATIC = document.body.hasAttribute('data-static'); // mode HTML pur (sans serveur)

  const notify = (msg) => {
    const el = document.createElement('div');
    el.className = 'toast align-items-center text-bg-dark border-0';
    el.setAttribute('role', 'alert');
    el.innerHTML = `<div class="d-flex"><div class="toast-body"></div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fermer"></button></div>`;
    el.querySelector('.toast-body').textContent = msg;
    document.getElementById('toasts').appendChild(el);
    const t = new bootstrap.Toast(el, { delay: 4000 });
    el.addEventListener('hidden.bs.toast', () => el.remove());
    t.show();
  };

  // Favoris (AJAX)
  $$('.um-fav').forEach((btn) => btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    btn.disabled = true;
    try {
      let favorited;
      if (STATIC) {
        favorited = !btn.classList.contains('active');
      } else {
        const r = await fetch(btn.dataset.url, { method: 'POST', headers: { 'X-Requested-With': 'fetch' } });
        if (!r.ok) throw new Error();
        ({ favorited } = await r.json());
      }
      if (btn.dataset.remove && !favorited) return btn.closest('.col').remove();
      btn.classList.toggle('active', favorited);
      btn.setAttribute('aria-pressed', favorited);
      btn.setAttribute('aria-label', favorited ? 'Retirer des favoris' : 'Ajouter aux favoris');
      btn.querySelector('i').className = `bi ${favorited ? 'bi-heart-fill' : 'bi-heart'}`;
      notify(favorited ? 'Ajouté aux favoris' : 'Retiré des favoris');
    } catch {
      notify('Action impossible, réessayez.');
    } finally {
      btn.disabled = false;
    }
  }));

  // Validation Bootstrap + confirmation des mots de passe
  $$('form.needs-validation').forEach((form) => form.addEventListener('submit', (e) => {
    $$('[data-match]', form).forEach((input) => {
      const ref = document.getElementById(input.dataset.match);
      input.setCustomValidity(input.value !== ref.value ? 'Différent' : '');
    });
    if (!form.checkValidity()) {
      e.preventDefault();
      e.stopPropagation();
    }
    form.classList.add('was-validated');
  }));

  // Afficher / masquer le mot de passe
  $$('[data-toggle-password]').forEach((btn) => btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.togglePassword);
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.querySelector('i').className = `bi ${show ? 'bi-eye-slash' : 'bi-eye'}`;
    btn.setAttribute('aria-label', show ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
  }));

  // Confirmation avant action sensible
  $$('form[data-confirm]').forEach((form) => form.addEventListener('submit', (e) => {
    if (!confirm(form.dataset.confirm)) e.preventDefault();
  }));

  // Filtres : envoi automatique
  $$('form[data-autosubmit] select').forEach((s) => s.addEventListener('change', () => s.form.submit()));

  // Aperçu des images + contrôle (5 max, 2 Mo)
  const input = document.getElementById('images');
  const preview = document.getElementById('preview');
  if (input && preview) {
    input.addEventListener('change', () => {
      preview.innerHTML = '';
      const files = [...input.files];
      if (files.length > 5 || files.some((f) => f.size > 2 * 1024 * 1024)) {
        notify('5 photos maximum, 2 Mo chacune.');
        input.value = '';
        return;
      }
      files.forEach((f) => {
        const img = document.createElement('img');
        img.alt = f.name;
        img.src = URL.createObjectURL(f);
        img.onload = () => URL.revokeObjectURL(img.src);
        preview.appendChild(img);
      });
    });
  }

  // Messagerie : aller au dernier message, Entrée envoie
  const chat = document.getElementById('chat-box');
  if (chat) {
    chat.scrollTop = chat.scrollHeight;
    const ta = document.getElementById('content');
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        ta.form.requestSubmit();
      }
    });
  }

  // Mode HTML pur : les formulaires POST ne sont pas envoyés
  if (STATIC) {
    $$('form[method="post"]').forEach((form) => form.addEventListener('submit', (e) => {
      if (e.defaultPrevented) return;
      e.preventDefault();
      if (/login|register/.test(location.pathname)) return (location.href = 'index.html');
      notify('Aperçu : action non enregistrée (pas de serveur).');
    }));
  }

  // Alertes : fermeture automatique
  $$('.alert-success, .alert-info').forEach((a) => setTimeout(() => bootstrap.Alert.getOrCreateInstance(a).close(), 5000));
});
