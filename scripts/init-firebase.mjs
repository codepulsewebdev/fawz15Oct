import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

for (const key of ['FIREBASE_PROJECT_ID','FIREBASE_CLIENT_EMAIL','FIREBASE_PRIVATE_KEY','FAWZ_ADMIN_EMAIL','FAWZ_ADMIN_PASSWORD']) {
  if (!process.env[key]) throw new Error(`${key} is required.`);
}
const app=initializeApp({credential:cert({projectId:process.env.FIREBASE_PROJECT_ID,clientEmail:process.env.FIREBASE_CLIENT_EMAIL,privateKey:process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g,'\n')})});
const auth=getAuth(app),db=getFirestore(app),email=process.env.FAWZ_ADMIN_EMAIL.trim().toLowerCase();
let user;try{user=await auth.getUserByEmail(email);await auth.updateUser(user.uid,{password:process.env.FAWZ_ADMIN_PASSWORD,displayName:process.env.FAWZ_ADMIN_NAME||'FAWZ Administrator',disabled:false})}catch(error){if(error.code!=='auth/user-not-found')throw error;user=await auth.createUser({email,password:process.env.FAWZ_ADMIN_PASSWORD,displayName:process.env.FAWZ_ADMIN_NAME||'FAWZ Administrator'})}
await db.collection('users').doc(user.uid).set({email,displayName:process.env.FAWZ_ADMIN_NAME||'FAWZ Administrator',address:'',phone:'',tier:'A',role:'admin',approved:true,disabled:false,mustChangePassword:false,updatedAt:FieldValue.serverTimestamp()},{merge:true});
console.log(`Administrator ready: ${email}`);
