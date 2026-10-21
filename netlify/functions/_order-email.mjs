import {createOrderPdf} from './_order-pdf.mjs';
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function emailParams(order,env=process.env){
 const recipient=env.ORDER_NOTIFICATION_EMAIL||'orders@fawzhabby.com',site=env.SITE_URL||env.URL||'';
 const adminUrl=/^https:\/\//i.test(site)?site.replace(/\/$/,'')+'/admin.html#orders':'';
 const rep=order.submittedBy||{};let rows='',shown=0;
 for(const item of order.items){const row=`<tr><td style="padding:9px;border:1px solid #ddd;text-align:center">${item.quantity}</td><td style="padding:9px;border:1px solid #ddd"><strong>${escapeHtml(item.name)}</strong>${item.details?'<br>'+escapeHtml(item.details):''}${item.productId?'<br>ID: '+escapeHtml(item.productId):''}</td></tr>`;if(Buffer.byteLength(rows+row)>34000)break;rows+=row;shown++}
 const more=shown<order.items.length?`<p>The email shows ${shown} of ${order.items.length} items. The attached PDF contains the complete order.</p>`:'';
 const date=new Date(order.placedAtISO||order.createdAt?.toDate?.()||order.createdAt||Date.now());const dateText=Number.isNaN(date.valueOf())?'':date.toLocaleString('en-ZA',{timeZone:'Africa/Johannesburg'});
 const html=`<div style="background:#f5f5f5;padding:24px;font-family:Arial,sans-serif;color:#202124"><div style="max-width:720px;margin:auto;background:#fff;border:1px solid #ddd;border-radius:10px;overflow:hidden"><div style="background:#e31e24;color:#fff;padding:22px"><h1 style="margin:0;font-size:23px">FAWZ HABBY</h1><p style="margin:8px 0 0">Order ${escapeHtml(order.orderNumber)}</p></div><div style="padding:22px"><table style="width:100%;font-size:14px"><tr><td style="vertical-align:top;width:55%"><strong>Customer</strong><br>${escapeHtml(order.customerName)}<br>${escapeHtml(order.phone)}<br>${escapeHtml(order.email||'')}<br>${escapeHtml(order.address)}</td><td style="vertical-align:top"><strong>Placed by</strong><br>${escapeHtml(rep.name||'')}<br>${escapeHtml(rep.email||'')}<br>${escapeHtml(dateText)}<br>Courier: ${escapeHtml(order.courierCompany||'Not supplied')}</td></tr></table><h2 style="font-size:17px;margin-top:24px">Ordered products</h2><table style="width:100%;border-collapse:collapse;font-size:13px;text-align:left"><thead><tr style="background:#eee"><th style="padding:10px;border:1px solid #ddd;width:70px">Quantity</th><th style="padding:10px;border:1px solid #ddd">Description / Size</th></tr></thead><tbody>${rows}</tbody></table>${more}<p style="padding:12px;background:#fff2f2;border-left:3px solid #e31e24">The full designed order form is attached as a PDF.</p>${adminUrl?`<p><a href="${escapeHtml(adminUrl)}" style="color:#b50914;font-weight:bold">View saved orders in admin</a></p>`:''}<p style="font-size:12px;color:#666">Order submitted without pricing. Administrator sign-in is required to view saved orders.</p></div></div></div>`;
 return{to_email:recipient,to_name:'FAWZ Orders',order_number:order.orderNumber,customer_name:order.customerName,customer_email:order.email||'',customer_address:order.address,customer_tel:order.phone,order_date:dateText,rep_name:rep.name||'',rep_email:rep.email||'',rep_tel:order.representativePhone||'',courier_company:order.courierCompany||'',admin_url:adminUrl,order_email_html:html,order_filename:`Order_${String(order.orderNumber).replace(/[^A-Za-z0-9_-]/g,'_')}.pdf`};
}
export async function notifyOrder(order,{env=process.env,send=fetch}={}){
 const recipient=env.ORDER_NOTIFICATION_EMAIL||'orders@fawzhabby.com';
 try{
  const params=emailParams(order,env),pdf=await createOrderPdf(order);
  if(pdf.length>Number(env.EMAILJS_ATTACHMENT_MAX_BYTES||512000))throw Error('PDF exceeds configured attachment limit.');
  params.order_pdf='data:application/pdf;base64,'+pdf.toString('base64');
  const payload={service_id:env.EMAILJS_SERVICE_ID||'service_m4jtn1e',template_id:env.EMAILJS_TEMPLATE_ID||'template_n50qcgl',user_id:env.EMAILJS_PUBLIC_KEY||'RTmO1qTUSJEMsJa1w',template_params:params};
  if(env.EMAILJS_PRIVATE_KEY)payload.accessToken=env.EMAILJS_PRIVATE_KEY;
  const response=await send('https://api.emailjs.com/api/v1.0/email/send',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(12000)});
  if(!response.ok){let detail='';try{detail=(await response.text()).replace(/<[^>]*>/g,' ').replace(/[\r\n]+/g,' ').trim();for(const key of [env.EMAILJS_PRIVATE_KEY,env.EMAILJS_PUBLIC_KEY])if(key)detail=detail.split(key).join('[redacted]');detail=detail.slice(0,500)}catch{}
   return{status:'failed',recipient,provider:'emailjs',error:`EmailJS rejected the email/PDF (HTTP ${response.status}). ${detail||'Check Email History and the template attachment settings.'}`};}
  return{status:'accepted',recipient,provider:'emailjs',attachmentName:params.order_filename,attachmentBytes:pdf.length};
 }catch{return{status:'failed',recipient,provider:'emailjs',error:'The email with PDF could not be sent. Check the email service, PDF attachment settings and attachment size limit, then resend the saved order.'}}
}
