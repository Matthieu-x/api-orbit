let animeUser;
function animeUrl(){
  const type=document.getElementById("animeType").value;
  return `${location.origin}/api/v1/anime/random?apikey=${encodeURIComponent(animeUser.api_key)}&type=${encodeURIComponent(type)}`;
}
function animeUpdate(){document.getElementById("animeEndpoint").textContent=animeUrl();}

function quoteUrl(){
  const anime=document.getElementById("quoteAnime").value.trim();
  const character=document.getElementById("quoteCharacter").value.trim();
  let u=`${location.origin}/api/v1/anime/quote?apikey=${encodeURIComponent(animeUser.api_key)}`;
  if(anime) u+=`&anime=${encodeURIComponent(anime)}`;
  if(character) u+=`&character=${encodeURIComponent(character)}`;
  return u;
}
function quoteUpdate(){document.getElementById("quoteEndpoint").textContent=quoteUrl();}

(async()=>{
  animeUser=await initShell("anime");
  if(!animeUser)return;

  const select=document.getElementById("animeType");
  animeUpdate();
  select.addEventListener("change",animeUpdate);
  document.getElementById("animeCopy").onclick=()=>copyToClipboard(animeUrl(),"Endpoint");

  const out=document.getElementById("animeResponse");
  const btn=document.getElementById("animeSend");

  btn.onclick=async()=>{
    btn.disabled=true;
    out.innerHTML='<div class="json-console-loading"><span class="orbit-spinner"></span>Buscando imagen...</div>';
    try{
      const r=await fetch(animeUrl(),{headers:{"x-orbit-ip":animeUser.orbit_ip||""}});
      const data=await r.json();
      if(!data.status){
        out.textContent=JSON.stringify(data,null,2);
      } else {
        out.innerHTML=`<img src="${data.result}" alt="Imagen anime" style="max-width:260px;width:100%;border-radius:12px;display:block;margin:0 auto 14px">`+
          `<pre style="white-space:pre-wrap;word-break:break-all;margin:0">${JSON.stringify({status:data.status,creator:data.creator,access:data.access,type:data.type,result:data.result},null,2)}</pre>`;
      }
    }catch(e){
      out.textContent="No se pudo contactar el endpoint";
    }finally{
      btn.disabled=false;
    }
  };

  quoteUpdate();
  document.getElementById("quoteAnime").addEventListener("input",quoteUpdate);
  document.getElementById("quoteCharacter").addEventListener("input",quoteUpdate);
  document.getElementById("quoteCopy").onclick=()=>copyToClipboard(quoteUrl(),"Endpoint");

  const quoteOut=document.getElementById("quoteResponse");
  const quoteBtn=document.getElementById("quoteSend");

  quoteBtn.onclick=async()=>{
    quoteBtn.disabled=true;
    quoteOut.innerHTML='<div class="json-console-loading"><span class="orbit-spinner"></span>Buscando frase...</div>';
    try{
      const r=await fetch(quoteUrl(),{headers:{"x-orbit-ip":animeUser.orbit_ip||""}});
      const data=await r.json();
      quoteOut.textContent=JSON.stringify(data,null,2);
    }catch(e){
      quoteOut.textContent="No se pudo contactar el endpoint";
    }finally{
      quoteBtn.disabled=false;
    }
  };
})();