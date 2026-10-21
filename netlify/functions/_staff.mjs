// Server-only account provisioning; never imported by browser code.
export const INTERNAL_STAFF = [
  {name:'Ismail',email:'fawz@fawzhabby.com'},
  {name:'Yusuf',email:'yusufmoola29@gmail.com'},
  {name:'Anisa',email:'anisa@fawzhabby.com'},
  {name:'Tasneem',email:'tasneem@fawzhabby.com'},
  {name:'Raeesah',email:'raeesah@fawzhabby.com'},
  {name:'Zaeed',email:'zaeed@fawzhabby.com'},
  {name:'Huzaifah',email:'huzaifah@fawzhabby.com'}
];
export async function provisionStaff({auth,db,FieldValue,createdBy}){
 const password=process.env.FAWZ_STAFF_PASSWORD||'Habby786';
 const results=[];
 for(const staff of INTERNAL_STAFF){
  try{
   let record,created=false;
   try{record=await auth.getUserByEmail(staff.email)}catch(error){if(error.code!=='auth/user-not-found')throw error;record=await auth.createUser({email:staff.email,password,displayName:staff.name,disabled:false});created=true}
   const ref=db.collection('users').doc(record.uid),snapshot=await ref.get(),existing=snapshot.data()||{};
   // Preserve administrative access and existing passwords when an account exists.
   await ref.set({email:staff.email,displayName:staff.name,role:existing.role==='admin'?'admin':'staff',internalStaff:true,tier:existing.tier||'A',approved:true,disabled:false,mustChangePassword:false,updatedAt:FieldValue.serverTimestamp(),...(created?{createdAt:FieldValue.serverTimestamp(),createdBy}:{})},{merge:true});
   if(record.disabled)await auth.updateUser(record.uid,{disabled:false});
   results.push({name:staff.name,email:staff.email,status:created?'created':'staff access enabled'});
  }catch(error){console.error('Staff setup failed',staff.email,error.code);results.push({name:staff.name,email:staff.email,status:'setup failed; retry'})}
 }
 return results;
}
