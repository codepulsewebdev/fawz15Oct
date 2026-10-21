import test from 'node:test';
import assert from 'node:assert/strict';
import {emailParams,notifyOrder} from '../netlify/functions/_order-email.mjs';
const order={orderNumber:'FAWZ-TEST',customerName:'Customer A',email:'customer@example.test',phone:'0111234567',address:'Address A',courierCompany:'Collection',submittedBy:{id:'staff-1',name:'Ismail',email:'staff@example.test'},items:[{quantity:2,name:'<script>bad</script> & Pins',details:'<b>Gold</b>',productId:'pin-1'}]};
test('FAWZ is the default recipient and the complete order is passed to EmailJS',async()=>{
 let request;
 const result=await notifyOrder(order,{env:{SITE_URL:'https://example.test',EMAILJS_PRIVATE_KEY:'test-secret'},send:async(url,options)=>{request={url,options,payload:JSON.parse(options.body)};return{ok:true,status:200}}});
 assert.equal(result.status,'accepted');assert.equal(result.recipient,'orders@fawzhabby.com');assert.equal(request.url,'https://api.emailjs.com/api/v1.0/email/send');assert.equal(request.options.method,'POST');assert.equal(request.payload.template_id,'template_n50qcgl');assert.equal(request.payload.accessToken,'test-secret');
 const p=request.payload.template_params;assert.equal(p.customer_name,'Customer A');assert.equal(p.rep_name,'Ismail');assert.equal(p.customer_tel,order.phone);assert.equal(p.admin_url,'https://example.test/admin.html#orders');assert.match(p.order_email_html,/FAWZ-TEST/);assert.match(p.order_email_html,/<table/);assert.doesNotMatch(p.order_email_html,/<script>|<b>/);assert.match(p.order_email_html,/&lt;script&gt;/);assert.match(p.order_pdf,/^data:application\/pdf;base64,JVBER/);assert.equal(p.order_filename,'Order_FAWZ-TEST.pdf');
});
test('recipient and EmailJS configuration can be changed without editing source',async()=>{
 let body;const env={ORDER_NOTIFICATION_EMAIL:'manager@example.test',EMAILJS_SERVICE_ID:'service_test',EMAILJS_TEMPLATE_ID:'template_test',EMAILJS_PUBLIC_KEY:'public_test'};
 await notifyOrder(order,{env,send:async(url,options)=>{body=JSON.parse(options.body);return{ok:true}}});assert.equal(body.template_params.to_email,'manager@example.test');assert.equal(body.service_id,'service_test');assert.equal(body.template_id,'template_test');assert.equal(body.user_id,'public_test');assert.equal(body.accessToken,undefined);
});
test('EmailJS rejection and connection failure do not report email success',async()=>{
 const rejected=await notifyOrder(order,{env:{},send:async()=>({ok:false,status:403})});assert.equal(rejected.status,'failed');assert.match(rejected.error,/HTTP 403/);
 const unavailable=await notifyOrder(order,{env:{},send:async()=>{throw Error('connection failure')}});assert.equal(unavailable.status,'failed');assert.equal(unavailable.recipient,'orders@fawzhabby.com');
});

test('every notification contains a valid PDF attachment and never sends without it',async()=>{
 let sent=0;const result=await notifyOrder(order,{env:{EMAILJS_ATTACHMENT_MAX_BYTES:'1'},send:async()=>{sent++;return{ok:true}}});assert.equal(result.status,'failed');assert.equal(sent,0);
});
test('a large email stays within the text-variable budget while its PDF contains every item',async()=>{
 const {PDFDocument}=await import('pdf-lib');const large={...order,items:Array.from({length:250},(_,i)=>({...order.items[0],name:'ITEM-'+(i+1)+' '+order.items[0].name,details:'Long size, colour and packaging details. '.repeat(6)}))};
 let payload;const result=await notifyOrder(large,{env:{},send:async(url,options)=>{payload=JSON.parse(options.body);return{ok:true}}});assert.equal(result.status,'accepted');
 const {order_pdf,...textParams}=payload.template_params;assert.ok(Buffer.byteLength(JSON.stringify(textParams))<50000);assert.match(textParams.order_email_html,/attached PDF contains the complete order/);
 const bytes=Buffer.from(order_pdf.split(',')[1],'base64');const pdf=await PDFDocument.load(bytes);assert.ok(pdf.getPageCount()>1);assert.ok(bytes.length<512000);assert.equal(result.attachmentBytes,bytes.length);
});
