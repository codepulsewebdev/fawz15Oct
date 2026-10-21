import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
const RED=rgb(0.89,0.118,0.14),INK=rgb(.1,.1,.1),GREY=rgb(.6,.6,.6),PALE=rgb(.975,.975,.975),WHITE=rgb(1,1,1);
export async function createOrderPdf(order){
 const pdf=await PDFDocument.create(),regular=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 pdf.setTitle(`FAWZ order ${order.orderNumber}`);pdf.setAuthor('FAWZ Haberdashery');
 const safe=value=>[...String(value??'').replace(/[\u2010-\u2015]/g,'-').replace(/\r/g,'')].map(c=>{if(c==='\n')return c;try{regular.encodeText(c);return c}catch{return'?'}}).join('');
 function wrap(value,width,size=8,font=regular){
  const lines=[];for(const paragraph of safe(value).split('\n')){let line='';for(const word of paragraph.split(/\s+/).filter(Boolean)){if(font.widthOfTextAtSize((line?line+' ':'')+word,size)<=width){line+=(line?' ':'')+word;continue}if(line)lines.push(line);line='';for(const c of word){if(font.widthOfTextAtSize(line+c,size)>width){lines.push(line);line=''}line+=c}}lines.push(line)}return lines.length?lines:[''];
 }
 let page,y;const LEFT=32,RIGHT=563,WIDTH=531,columns=[48,52,287,88,56],x=[LEFT];for(const w of columns)x.push(x.at(-1)+w);
 const text=(value,px,py,size=8,font=regular,color=INK)=>page.drawText(safe(value),{x:px,y:py,size,font,color});
 const line=(x1,y1,x2,y2,color=GREY,width=.6)=>page.drawLine({start:{x:x1,y:y1},end:{x:x2,y:y2},color,thickness:width});
 const date=new Date(order.placedAtISO||order.createdAt?.toDate?.()||order.createdAt||Date.now());
 const dateText=Number.isNaN(date.valueOf())?'':date.toLocaleDateString('en-ZA',{timeZone:'Africa/Johannesburg'});
 const fieldsLeft=[['Customer:',order.customerName],['Address:',order.address],['Tel:',order.phone],['Email:',order.email||'']];
 const fieldsRight=[['ORDER',order.orderNumber],['Date:',dateText],['Reps Name:',order.submittedBy?.name||''],['Reps Tel No.:',order.representativePhone||''],['Courier Company:',order.courierCompany||'']];
 function fieldPlan(fields,width){return fields.map(([label,value])=>({label,lines:wrap(value,width-94,8),height:Math.max(16,wrap(value,width-94,8).length*11+5)}))}
 const plans=[fieldPlan(fieldsLeft,255),fieldPlan(fieldsRight,260)],boxH=Math.max(112,...plans.map(a=>a.reduce((sum,f)=>sum+f.height,20)));
 function header(){
  page=pdf.addPage([595.28,841.89]);page.drawRectangle({x:24,y:30,width:547,height:787,borderColor:RED,borderWidth:1.2});
  page.drawCircle({x:49,y:783,size:16,borderColor:RED,borderWidth:1.5,color:WHITE});text('F',43,776,21,bold,RED);text('FAWZ HABBY',75,777,24,bold,RED);
  const contact=['Telephone: +27 11 852 0060/1/2','E-mail: fawz@fawzhabby.com','Website: www.fawzhabby.com','Mobile: +27 83 790 6433'];contact.forEach((s,i)=>text(s,386,803-i*11,7));line(LEFT,754,RIGHT,754,RED,1.4);
  const top=739;for(let i=0;i<2;i++){const bx=i?303:LEFT,bw=i?260:255;page.drawRectangle({x:bx,y:top-boxH,width:bw,height:boxH,borderColor:rgb(.8,.8,.8),borderWidth:.6,color:PALE});let fy=top-16;for(const f of plans[i]){text(f.label,bx+10,fy,7.5,bold);for(const [j,s]of f.lines.entries())text(s,bx+90,fy-j*11,8,f.label==='ORDER'?bold:regular,f.label==='ORDER'?RED:INK);fy-=f.height}}
  y=top-boxH-18;tableHead();
 }
 function tableHead(){const h=24;page.drawRectangle({x:LEFT,y:y-h,width:WIDTH,height:h,color:rgb(.91,.91,.91)});['SUPPLIED','QUANTITY','DESCRIPTION / SIZE','NOTES','CHECK'].forEach((label,i)=>text(label,x[i]+5,y-15,7,bold));grid(y,h);y-=h}
 function grid(top,height){for(const px of x)line(px,top,px,top-height);line(LEFT,top,RIGHT,top);line(LEFT,top-height,RIGHT,top-height)}
 header();
 for(const item of order.items||[]){
  let lines=[...wrap(item.name,columns[2]-14,8.5,bold).map(s=>({s,b:true})),...wrap([item.category?'Category: '+item.category:'',item.details||'',item.productId?'ID: '+item.productId:''].filter(Boolean).join('\n'),columns[2]-14,7.5).map(s=>({s,b:false}))];
  let continued=false;while(lines.length){if(y<120)header();const capacity=Math.max(1,Math.floor((y-87-14)/11));const chunk=lines.splice(0,capacity),h=Math.max(34,chunk.length*11+14);if(y-h<78){header();continue}grid(y,h);text(continued?'cont.':item.quantity,x[1]+17,y-18,9,bold);chunk.forEach((l,j)=>text(l.s,x[2]+7,y-15-j*11,l.b?8.5:7.5,l.b?bold:regular));y-=h;continued=true;}
 }
 if((order.items||[]).length<10){for(let n=(order.items||[]).length;n<10&&y-30>=100;n++){grid(y,30);y-=30}}
 if(y<98)header();line(LEFT,y-15,RIGHT,y-15,rgb(.8,.8,.8),1);text('Order submitted without pricing',LEFT,y-34,10,bold);
 const pages=pdf.getPages();pages.forEach((p,i)=>{page=p;text(`${order.orderNumber}  |  Page ${i+1} of ${pages.length}`,LEFT,42,7,regular,rgb(.4,.4,.4))});
 return Buffer.from(await pdf.save({useObjectStreams:true}));
}
