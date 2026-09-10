let toolsUser;
function qrUrl(){
  const t=document.getElementById("qrText").value;
  const s=document.getElementById("qrSize").value.trim();
  let u=`${location.origin}/api/v1/tools/qr?apikey=${encodeURIComponent(toolsUser.api_key)}&text=${encodeURIComponent(t)}`;
  if(s) u+=`&size=${encodeURIComponent(s)}`;
  return u;
}
function qrUpdate(){document.getElementById("qrEndpointUrl").textContent=qrUrl();}

function pwUrl(){
  const length=document.getElementById("pwLength").value.trim()||"16";
  const lower=document.getElementById("pwLower").checked;
  const upper=document.getElementById("pwUpper").checked;
  const numbers=document.getElementById("pwNumbers").checked;
  const symbols=document.getElementById("pwSymbols").checked;
  return `${location.origin}/api/v1/tools/password?apikey=${encodeURIComponent(toolsUser.api_key)}&length=${encodeURIComponent(length)}&lowercase=${lower}&uppercase=${upper}&numbers=${numbers}&symbols=${symbols}`;
}
function pwUpdate(){document.getElementById("pwEndpointUrl").textContent=pwUrl();}

(async()=>{
  toolsUser=await initShell("tools");
  if(!toolsUser)return;
  const input=document.getElementById("qrText");
  const sizeInput=document.getElementById("qrSize");
  qrUpdate();
  input.addEventListener("input",qrUpdate);
  sizeInput.addEventListener("input",qrUpdate);
  document.getElementById("qrCopyBtn").onclick=()=>copyToClipboard(qrUrl(),"Endpoint");

  const out=document.getElementById("qrResponse");
  const btn=document.getElementById("qrSendBtn");

  btn.onclick=async()=>{
    if(!input.value.trim())return showToast("Escribe un texto");
    btn.disabled=true;
    out.innerHTML='<div class="json-console-loading"><span class="orbit-spinner"></span>Generando QR...</div>';
    try{
      const jsonUrl=qrUrl()+"&format=json";
      const r=await fetch(jsonUrl,{headers:{"x-orbit-ip":toolsUser.orbit_ip||""}});
      const data=await r.json();
      if(!data.status){
        out.textContent=JSON.stringify(data,null,2);
      } else {
        out.innerHTML=`<img src="${data.result}" alt="QR generado" style="max-width:220px;width:100%;border-radius:12px;display:block;margin:0 auto 14px">`+
          `<pre style="white-space:pre-wrap;word-break:break-all;margin:0">${JSON.stringify({status:data.status,creator:data.creator,text:data.text},null,2)}</pre>`;
      }
    }catch(e){
      out.textContent="No se pudo contactar el endpoint";
    }finally{
      btn.disabled=false;
    }
  };

  const pwInputs=[document.getElementById("pwLength"),document.getElementById("pwLower"),document.getElementById("pwUpper"),document.getElementById("pwNumbers"),document.getElementById("pwSymbols")];
  pwUpdate();
  pwInputs.forEach(el=>el.addEventListener(el.type==="checkbox"?"change":"input",pwUpdate));
  document.getElementById("pwCopyBtn").onclick=()=>copyToClipboard(pwUrl(),"Endpoint");

  const pwOut=document.getElementById("pwResponse");
  const pwBtn=document.getElementById("pwSendBtn");

  pwBtn.onclick=async()=>{
    pwBtn.disabled=true;
    pwOut.innerHTML='<div class="json-console-loading"><span class="orbit-spinner"></span>Generando...</div>';
    try{
      const r=await fetch(pwUrl(),{headers:{"x-orbit-ip":toolsUser.orbit_ip||""}});
      const data=await r.json();
      pwOut.textContent=JSON.stringify(data,null,2);
    }catch(e){
      pwOut.textContent="No se pudo contactar el endpoint";
    }finally{
      pwBtn.disabled=false;
    }
  };
})();