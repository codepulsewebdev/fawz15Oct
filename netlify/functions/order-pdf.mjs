import {currentUser,db,handle,json} from './_shared.mjs';
import {createOrderPdf} from './_order-pdf.mjs';
export const handler=handle(async event=>{
 if(event.httpMethod!=='GET')return json(405,{error:'Method not allowed.'});
 const user=await currentUser(event),id=String(event.queryStringParameters?.orderId||'');
 if(!/^[A-Za-z0-9_-]{1,160}$/.test(id))return json(400,{error:'Invalid order.'});
 const snap=await db.collection('orders').doc(id).get();
 if(!snap.exists)return json(404,{error:'Order not found.'});
 const order=snap.data();if(user.role!=='admin'&&order.userId!==user.id)return json(403,{error:'This order is not available to your account.'});
 const pdf=await createOrderPdf(order),name=`Order_${String(order.orderNumber).replace(/[^A-Za-z0-9_-]/g,'_')}.pdf`;
 return{statusCode:200,headers:{'content-type':'application/pdf','content-disposition':`attachment; filename="${name}"`,'cache-control':'no-store','x-content-type-options':'nosniff'},isBase64Encoded:true,body:pdf.toString('base64')};
});
