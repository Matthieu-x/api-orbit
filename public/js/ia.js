let iaUser;
function geminiUrl(){const t=document.getElementById("geminiText").value;return `${location.origin}/api/v1/ia?apikey=${encodeURIComponent(iaUser.api_key)}&text=${encodeURIComponent(t)}`;}
function geminiUpdate(){document.getElementById("geminiEndpointUrl").textContent=geminiUrl();}
(async()=>{
  iaUser=await initShell("ia");
  if(!iaUser)return;
  const input=document.getElementById("geminiText");
  geminiUpdate();
  input.addEventListener("input",geminiUpdate);
  document.getElementById("geminiCopyBtn").onclick=()=>copyToClipboard(geminiUrl(),"Endpoint");

  const out=document.getElementById("geminiResponse");
  const btn=document.getElementById("geminiSendBtn");

  if(!iaUser.is_vip && !iaUser.is_admin){
    out.textContent="Este endpoint requiere VIP. Ve a /vip para activar tu plan.";
  }

  btn.onclick=async()=>{
    if(!input.value.trim())return showToast("Escribe un mensaje");
    btn.disabled=true;
    out.innerHTML='<div class="json-console-loading"><span class="orbit-spinner"></span>Consultando a Gemini...</div>';
    try{
      const r=await fetch(geminiUrl());
      out.textContent=JSON.stringify(await r.json(),null,2);
    }catch(e){
      out.textContent="No se pudo contactar el endpoint";
    }finally{
      btn.disabled=false;
    }
  };
})();
