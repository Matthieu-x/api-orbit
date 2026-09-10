function fillProfile(user) {
  document.getElementById("profileAvatar").src = user.photo || fallbackAvatarUrl(user.name);
  document.getElementById("profileName").textContent = user.name;
  document.getElementById("profileEmail").textContent = user.email;
  document.getElementById("statRemaining").textContent = user.requests_remaining;
  document.getElementById("statLimit").textContent = user.requests_limit;
  document.getElementById("statKey").textContent = user.api_key;
  document.getElementById("nameInput").value = user.name;
}

function fallbackAvatarUrl(name) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='84' height='84'><rect width='84' height='84' rx='42' fill='%231a2233'/><text x='50%25' y='56%25' font-family='Inter' font-size='30' fill='%238a93a8' text-anchor='middle'>${initial}</text></svg>`;
  return `data:image/svg+xml,${svg}`;
}

(async () => {
  const user = await initShell("perfil");
  if (!user) return;

  fillProfile(user);

  const photoUrl = document.getElementById("photoUrl");
  const photoForm = document.getElementById("photoForm");
  const savePhotoBtn = document.getElementById("savePhotoBtn");
  const removePhotoBtn = document.getElementById("removePhotoBtn");

  photoUrl.value = user.photo || "";

  document.getElementById("photoEditBtn").addEventListener("click", () => {
    photoUrl.focus();
    photoUrl.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  photoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const url = photoUrl.value.trim();
    savePhotoBtn.disabled = true;

    const { status, data } = await orbitFetch("/api/user/profile/photo", {
      method: "PUT",
      body: JSON.stringify({ photo: url })
    });

    savePhotoBtn.disabled = false;

    if (status !== 200 || !data.ok) {
      showToast(data.error || "No se pudo actualizar la foto");
      return;
    }

    document.getElementById("profileAvatar").src = data.photo || fallbackAvatarUrl(user.name);
    photoUrl.value = data.photo || "";
    orbitUser.photo = data.photo || null;
    const topAvatarLink = document.querySelector('.topbar-right a[href="/perfil"]');
    if (topAvatarLink) topAvatarLink.innerHTML = renderAvatar(orbitUser);
    showToast(data.photo ? "Foto actualizada" : "Foto eliminada");
  });

  removePhotoBtn.addEventListener("click", async () => {
    removePhotoBtn.disabled = true;

    const { status, data } = await orbitFetch("/api/user/profile/photo", { method: "DELETE" });

    removePhotoBtn.disabled = false;

    if (status !== 200 || !data.ok) {
      showToast(data.error || "No se pudo eliminar la foto");
      return;
    }

    document.getElementById("profileAvatar").src = fallbackAvatarUrl(user.name);
    photoUrl.value = "";
    orbitUser.photo = null;
    const topAvatarLink = document.querySelector('.topbar-right a[href="/perfil"]');
    if (topAvatarLink) topAvatarLink.innerHTML = renderAvatar(orbitUser);
    showToast("Foto eliminada");
  });

  document.getElementById("nameForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorBox = document.getElementById("errorBox");
    errorBox.classList.remove("show");

    const saveBtn = document.getElementById("saveNameBtn");
    saveBtn.disabled = true;

    const { status, data } = await orbitFetch("/api/user/profile", {
      method: "PUT",
      body: JSON.stringify({ name: document.getElementById("nameInput").value })
    });

    saveBtn.disabled = false;

    if (status !== 200 || !data.ok) {
      errorBox.textContent = data.error || "No se pudo guardar el nombre";
      errorBox.classList.add("show");
      return;
    }

    document.getElementById("profileName").textContent = data.name;
    showToast("Nombre actualizado");
  });

  // Restablecer contraseña: mismo sistema de /forgot-password, pero
  // disparado directo con el correo ya conocido de la cuenta.
  document.getElementById("resetPasswordBtn").addEventListener("click", async () => {
    const btn = document.getElementById("resetPasswordBtn");
    btn.disabled = true;
    btn.textContent = "Enviando...";

    const { data } = await orbitFetch("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: user.email })
    });

    btn.disabled = false;
    btn.textContent = "Restablecer contraseña";
    showToast(data.message || "Revisa tu correo para restablecer tu contraseña");
  });

  // Eliminar cuenta
  const deleteAccountCard = document.getElementById("deleteAccountCard");
  const deleteErrorBox = document.getElementById("deleteErrorBox");

  document.getElementById("deleteAccountBtn").addEventListener("click", () => {
    deleteAccountCard.style.display = "block";
    deleteAccountCard.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  document.getElementById("cancelDeleteBtn").addEventListener("click", () => {
    deleteAccountCard.style.display = "none";
    deleteErrorBox.classList.remove("show");
    document.getElementById("deletePasswordInput").value = "";
  });

  document.getElementById("deleteAccountForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    deleteErrorBox.classList.remove("show");

    const confirmBtn = document.getElementById("confirmDeleteBtn");
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Eliminando...";

    const { status, data } = await orbitFetch("/api/user/account", {
      method: "DELETE",
      body: JSON.stringify({ password: document.getElementById("deletePasswordInput").value })
    });

    if (status !== 200 || !data.ok) {
      deleteErrorBox.textContent = data.error || "No se pudo eliminar la cuenta";
      deleteErrorBox.classList.add("show");
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Sí, eliminar mi cuenta";
      return;
    }

    window.location.href = "/login";
  });
})();
