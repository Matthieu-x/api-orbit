let animeUser;
function animeUrl(){
  const type=document.getElementById("animeType").value;
  return `${location.origin}/api/v1/anime/random?apikey=${encodeURIComponent(animeUser.api_key)}&type=${encodeURIComponent(type)}`;
}
function animeUpdate(){document.getElementById("animeEndpoint").textContent=animeUrl();}

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
      const r=await fetch(animeUrl());
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
})();