(async () => {
  const user = await initShell("dashboard");
  if (!user) return;

  document.getElementById("statRemaining").textContent = user.requests_remaining;
  document.getElementById("statLimit").textContent = user.requests_limit;
  document.getElementById("statKey").textContent = user.api_key;
})();
