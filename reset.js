'use strict';
(async()=>{
 const status=document.getElementById('status');const say=s=>status.textContent=s;
 const c=window.BIERWELT_CONFIG||{};
 if(!c.url||!c.anonKey||c.url.includes('DEINE_')||c.anonKey.includes('DEIN_')||!window.supabase){say('Konfiguration oder Supabase-Bibliothek fehlt.');return;}
 const db=window.supabase.createClient(c.url,c.anonKey);
 const showChange=()=>{document.getElementById('request').classList.add('hidden');document.getElementById('change').classList.remove('hidden');say('Reset-Link bestätigt.');};
 let recovery=false;
 db.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY'){recovery=true;showChange();}});
 if(location.hash.includes('type=recovery')||location.search.includes('token_hash=')){
  const {data,error}=await db.auth.getSession();
  if(error)say('Der Link ist ungültig oder abgelaufen: '+error.message);
  else if(data.session){recovery=true;showChange();}
 }
 document.getElementById('send').onclick=async()=>{
  const email=document.getElementById('email').value.trim();if(!email){say('Bitte E-Mail-Adresse eingeben.');return;}
  say('E-Mail wird angefordert …');
  const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:new URL('reset.html',location.href).href});
  say(error?'Fehler: '+error.message:'Wenn die Adresse registriert ist, erhältst du eine E-Mail. Prüfe auch den Spam-Ordner.');
 };
 document.getElementById('update').onclick=async()=>{
  if(!recovery){say('Bitte zuerst den Link aus der Reset-E-Mail öffnen.');return;}
  const password=document.getElementById('password').value;
  if(password.length<8){say('Bitte mindestens 8 Zeichen verwenden.');return;}
  say('Passwort wird geändert …');
  const {error}=await db.auth.updateUser({password});
  if(error)say('Fehler: '+error.message);
  else{await db.auth.signOut();document.getElementById('change').classList.add('hidden');say('Passwort geändert! Du kannst dich jetzt auf der Bearbeitungsseite anmelden.');}
 };
})();
