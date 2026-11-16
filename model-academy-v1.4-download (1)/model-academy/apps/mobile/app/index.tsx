import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const gold = '#b99a63';
export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => subscription.unsubscribe();
  }, []);

  const authenticate = async () => {
    if (!supabase) return Alert.alert('Configuration requise', 'Les clés Supabase mobiles ne sont pas encore configurées.');
    if (!email.trim() || password.length < 8) return Alert.alert('Informations manquantes', 'Saisis un email valide et un mot de passe de 8 caractères minimum.');
    setBusy(true);
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password });
    setBusy(false);
    if (result.error) Alert.alert('Authentification', result.error.message);
    else if (mode === 'signup' && !result.data.session) Alert.alert('Vérifie ton email', 'Un lien de confirmation a été envoyé si la confirmation email est activée.');
  };

  if (!ready) return <View style={{flex:1,backgroundColor:'#11100f',alignItems:'center',justifyContent:'center'}}><ActivityIndicator color={gold}/></View>;

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex:1,backgroundColor:'#11100f'}}>
    <ScrollView contentContainerStyle={{padding:26,paddingTop:70,paddingBottom:60}} keyboardShouldPersistTaps="handled">
      <Text style={{color:gold,letterSpacing:4,fontSize:12,fontWeight:'700'}}>MODEL ACADEMY</Text>
      <Text style={{color:'#f5f1e9',fontSize:43,lineHeight:51,marginTop:38}}>Your talent.{'\n'}<Text style={{color:gold,fontStyle:'italic'}}>Your runway.</Text>{'\n'}Your future.</Text>
      <Text style={{color:'#c5bdb1',fontSize:15,lineHeight:25,marginTop:18}}>Apprends le métier, perfectionne ta technique et construis ta carrière dans la mode.</Text>
      {!session ? <View style={{marginTop:34,gap:12}}>
        <Text style={{color:'#f5f1e9',fontSize:21,fontWeight:'600'}}>{mode === 'login' ? 'Connexion' : 'Créer mon compte'}</Text>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Adresse email" placeholderTextColor="#8e877d" style={{borderWidth:1,borderColor:'#514737',padding:15,color:'#f5f1e9'}}/>
        <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Mot de passe (8 caractères minimum)" placeholderTextColor="#8e877d" style={{borderWidth:1,borderColor:'#514737',padding:15,color:'#f5f1e9'}}/>
        <Pressable disabled={busy} onPress={authenticate} style={{backgroundColor:gold,padding:17,alignItems:'center',marginTop:4}}><Text style={{fontWeight:'800',letterSpacing:1,color:'#11100f'}}>{busy ? 'PATIENTE…' : mode === 'login' ? 'SE CONNECTER' : 'CRÉER MON COMPTE'}</Text></Pressable>
        <Pressable onPress={()=>setMode(mode === 'login' ? 'signup' : 'login')} style={{padding:12}}><Text style={{color:'#d7c8ac',textAlign:'center',fontSize:12}}>{mode === 'login' ? 'Nouveau membre ? Créer un compte' : 'Déjà membre ? Se connecter'}</Text></Pressable>
        {!supabase && <Text style={{color:'#d7a96b',fontSize:11,lineHeight:18}}>Configuration requise : ajoute EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans l’environnement mobile.</Text>}
      </View> : <View style={{marginTop:30,borderWidth:1,borderColor:'#514737',padding:20,gap:12}}>
        <Text style={{color:gold,letterSpacing:2,fontSize:11}}>SESSION ACTIVE</Text><Text style={{color:'#f5f1e9',fontSize:17}}>{session.user.email}</Text>
        <Text style={{color:'#c5bdb1',fontSize:13,lineHeight:21}}>Ton compte est connecté. Retrouve les modules complets depuis ton espace MODEL ACADEMY web.</Text>
        <Pressable onPress={()=>supabase?.auth.signOut()} style={{borderWidth:1,borderColor:'#b99a63',padding:13,alignItems:'center'}}><Text style={{color:'#f5f1e9'}}>SE DÉCONNECTER</Text></Pressable>
      </View>}
      <View style={{marginTop:46,gap:12}}>{['MODEL SCHOOL','MODEL AI COACH','PROFESSIONAL PORTFOLIO','CASTINGS & CAREER','SPONSOR CONNECT'].map(x=><View key={x} style={{borderWidth:1,borderColor:'#514737',padding:18}}><Text style={{color:gold,letterSpacing:2,fontSize:11}}>{x}</Text></View>)}</View>
      <Text style={{color:'#777067',fontSize:10,marginTop:28,lineHeight:16}}>MODEL ACADEMY · Lomé, Togo · Version mobile en développement</Text>
    </ScrollView>
  </KeyboardAvoidingView>;
}
