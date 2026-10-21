export function orderDetails(user,body,cleanText){
 const internal=user.role==='staff'||user.role==='admin'||user.internalStaff===true;
 const input=body.customer||(internal?{}:{name:user.displayName,email:user.email,address:user.address,phone:user.phone});
 const customer={customerName:cleanText(input.name,160),email:cleanText(input.email,200).toLowerCase(),address:cleanText(input.address,500),phone:cleanText(input.phone,50)};
 if(!customer.customerName||!customer.address||!customer.phone)throw new Error('Enter the customer name, delivery address and telephone number for this order.');
 if(customer.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email))throw new Error('Enter a valid customer email address.');
 return {...customer,submittedBy:{id:user.id,name:user.displayName,email:user.email},onBehalfOfCustomer:internal,representativePhone:internal?cleanText(body.representativePhone,50):user.phone||'',courierCompany:cleanText(body.courierCompany,160)};
}
