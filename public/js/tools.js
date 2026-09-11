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

function trUrl(){
  const t=document.getElementById("trText").value;
  const from=document.getElementById("trFrom").value.trim()||"auto";
  const to=document.getElementById("trTo").value.trim()||"es";
  return `${location.origin}/api/v1/tools/translate?apikey=${encodeURIComponent(toolsUser.api_key)}&text=${encodeURIComponent(t)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
}
function trUpdate(){document.getElementById("trEndpointUrl").textContent=trUrl();}

function b64Url(){
  const t=document.getElementById("b64Text").value;
  const action=document.getElementById("b64Decode").checked?"decode":"encode";
  return `${location.origin}/api/v1/tools/base64?apikey=${encodeURIComponent(toolsUser.api_key)}&text=${encodeURIComponent(t)}&action=${action}`;
}
function b64Update(){document.getElementById("b64EndpointUrl").textContent=b64Url();}

function hashUrl(){
  const t=document.getElementById("hashText").value;
  const algo=document.getElementById("hashAlgo").value;
  let u=`${location.origin}/api/v1/tools/hash?apikey=${encodeURIComponent(toolsUser.api_key)}&text=${encodeURIComponent(t)}`;
  if(algo) u+=`&algorithm=${encodeURIComponent(algo)}`;
  return u;
}
function hashUpdate(){document.getElementById("hashEndpointUrl").textContent=hashUrl();}

function uuidUrl(){
  const count=document.getElementById("uuidCount").value.trim()||"1";
  return `${location.origin}/api/v1/tools/uuid?apikey=${encodeURIComponent(toolsUser.api_key)}&count=${encodeURIComponent(count)}`;
}
function uuidUpdate(){document.getElementById("uuidEndpointUrl").textContent=uuidUrl();}

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

  const trInputs=[document.getElementById("trText"),document.getElementById("trFrom"),document.getElementById("trTo")];
  trUpdate();
  trInputs.forEach(el=>el.addEventListener("input",trUpdate));
  document.getElementById("trCopyBtn").onclick=()=>copyToClipboard(trUrl(),"Endpoint");

  const trOut=document.getElementById("trResponse");
  const trBtn=document.getElementById("trSendBtn");

  trBtn.onclick=async()=>{
    const trText=document.getElementById("trText");
    if(!trText.value.trim())return showToast("Escribe un texto");
    trBtn.disabled=true;
    trOut.innerHTML='<div class="json-console-loading"><span class="orbit-spinner"></span>Traduciendo...</div>';
    try{
      const r=await fetch(trUrl(),{headers:{"x-orbit-ip":toolsUser.orbit_ip||""}});
      const data=await r.json();
      trOut.textContent=JSON.stringify(data,null,2);
    }catch(e){
      trOut.textContent="No se pudo contactar el endpoint";
    }finally{
      trBtn.disabled=false;
    }
  };

  const b64Inputs=[document.getElementById("b64Text"),document.getElementById("b64Encode"),document.getElementById("b64Decode")];
  b64Update();
  b64Inputs.forEach(el=>el.addEventListener(el.type==="radio"?"change":"input",b64Update));
  document.getElementById("b64CopyBtn").onclick=()=>copyToClipboard(b64Url(),"Endpoint");

  const b64Out=document.getElementById("b64Response");
  const b64Btn=document.getElementById("b64SendBtn");

  b64Btn.onclick=async()=>{
    const b64Text=document.getElementById("b64Text");
    if(!b64Text.value.trim())return showToast("Escribe un texto");
    b64Btn.disabled=true;
    b64Out.innerHTML='<div class="json-console-loading"><span class="orbit-spinner"></span>Procesando...</div>';
    try{
      const r=await fetch(b64Url(),{headers:{"x-orbit-ip":toolsUser.orbit_ip||""}});
      const data=await r.json();
      b64Out.textContent=JSON.stringify(data,null,2);
    }catch(e){
      b64Out.textContent="No se pudo contactar el endpoint";
    }finally{
      b64Btn.disabled=false;
    }
  };

  const hashInputs=[document.getElementById("hashText"),document.getElementById("hashAlgo")];
  hashUpdate();
  hashInputs.forEach(el=>el.addEventListener(el.tagName==="SELECT"?"change":"input",hashUpdate));
  document.getElementById("hashCopyBtn").onclick=()=>copyToClipboard(hashUrl(),"Endpoint");

  const hashOut=document.getElementById("hashResponse");
  const hashBtn=document.getElementById("hashSendBtn");

  hashBtn.onclick=async()=>{
    const hashText=document.getElementById("hashText");
    if(!hashText.value.trim())return showToast("Escribe un texto");
    hashBtn.disabled=true;
    hashOut.innerHTML='<div class="json-console-loading"><span class="orbit-spinner"></span>Generando hash...</div>';
    try{
      const r=await fetch(hashUrl(),{headers:{"x-orbit-ip":toolsUser.orbit_ip||""}});
      const data=await r.json();
      hashOut.textContent=JSON.stringify(data,null,2);
    }catch(e){
      hashOut.textContent="No se pudo contactar el endpoint";
    }finally{
      hashBtn.disabled=false;
    }
  };

  const uuidInput=document.getElementById("uuidCount");
  uuidUpdate();
  uuidInput.addEventListener("input",uuidUpdate);
  document.getElementById("uuidCopyBtn").onclick=()=>copyToClipboard(uuidUrl(),"Endpoint");

  const uuidOut=document.getElementById("uuidResponse");
  const uuidBtn=document.getElementById("uuidSendBtn");

  uuidBtn.onclick=async()=>{
    uuidBtn.disabled=true;
    uuidOut.innerHTML='<div class="json-console-loading"><span class="orbit-spinner"></span>Generando...</div>';
    try{
      const r=await fetch(uuidUrl(),{headers:{"x-orbit-ip":toolsUser.orbit_ip||""}});
      const data=await r.json();
      uuidOut.textContent=JSON.stringify(data,null,2);
    }catch(e){
      uuidOut.textContent="No se pudo contactar el endpoint";
    }finally{
      uuidBtn.disabled=false;
    }
  };
})();