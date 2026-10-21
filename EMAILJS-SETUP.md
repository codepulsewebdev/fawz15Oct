# EmailJS: styled order email with designed PDF attachment

## Required EmailJS template settings

Open Email Templates → Order Confirmation (template_n50qcgl) → edit.

To Email: orders@fawzhabby.com
Subject: New FAWZ order {{order_number}}
From Name: FAWZ Orders
From Email: use the default sender of your connected email service
Reply To: {{rep_email}}

Replace the message content with exactly:

{{{order_email_html}}}

Use THREE curly braces on each side. The server supplies the complete styled HTML table and escapes all customer/product values. Do not use {{message}} or the old items_table_rows template. The file emailjs-order-template.html contains this exact replacement content.

Open the template's Attachments tab and add a Dynamic / Variable Attachment:

Attachment type: Variable Attachment
Parameter name: order_pdf
Filename: {{order_filename}}
Content type: application/pdf (choose PDF if the screen offers a format selector)

Save the template. These settings are required: code alone cannot add an attachment if the EmailJS template has no configured attachment variable.

EmailJS's Free plan does not support attachments. Use an attachment-enabled plan (Personal or above). Personal currently supports attachments up to 500 KB. The code generates compressed vector PDFs; the stress-tested 250-item example was below this limit. Set EMAILJS_ATTACHMENT_MAX_BYTES only if your plan has a different limit.

## Server access and Netlify settings

In EmailJS Account → Security, enable API requests for non-browser applications. If private-key authorization is enabled, put the private key directly into Netlify as EMAILJS_PRIVATE_KEY; keep it out of frontend code and chat.

Under Netlify Project configuration → Environment variables, add these with Functions scope and the Production deployment context:

ORDER_NOTIFICATION_EMAIL=orders@fawzhabby.com
SITE_URL=<the full live HTTPS website URL>
EMAILJS_PRIVATE_KEY=<private key, when required by your EmailJS security settings>

These existing defaults are already wired into the code; override them only if EmailJS shows different values:

EMAILJS_SERVICE_ID=service_m4jtn1e
EMAILJS_TEMPLATE_ID=template_n50qcgl
EMAILJS_PUBLIC_KEY=RTmO1qTUSJEMsJa1w

Confirm that service_m4jtn1e is connected under Email Services in the same EmailJS account. Keep the To Email address and ORDER_NOTIFICATION_EMAIL identical so the recorded recipient matches the template.

Deploy this updated ZIP using the site's existing build/deployment process, which must install the package.json dependencies and deploy Netlify Functions. A static-only file upload will not deploy the server PDF generator. Keep the existing images directory; it was not included in the original uploads. A new deploy is required after environment changes.

## Verify delivery

Submit one clearly labelled test order after deployment. Check:

1. Admin → Orders shows the saved order and email status.
2. EmailJS → Email History has no error.
3. orders@fawzhabby.com receives a styled email table with an actual Order_<order-number>.pdf attachment.
4. Open the PDF and verify customer details, staff member, all quantities and products, and page numbering.

The PDF uses the final order form's red FAWZ header, customer/representative boxes and Supplied / Quantity / Description / Notes / Check table. Prices are omitted. Long orders paginate. The same PDF can be downloaded from the successful submission confirmation or Admin → Orders → Download PDF. A resend regenerates the complete PDF from the saved order; it does not depend on the browser cart still containing the items.

If sending fails, the saved order remains available. Correct the settings and choose Resend email in Admin → Orders. Keep at least one second between sends because of EmailJS's API rate limit. An accepted API response confirms acceptance by EmailJS; verify the actual inbox and PDF to confirm delivery.

No live email has been sent or verified from this workspace. Automated email checks use mocked API responses.

Official references:
https://www.emailjs.com/docs/user-guide/file-attachments/
https://www.emailjs.com/docs/user-guide/dynamic-variables-templates/
https://www.emailjs.com/pricing/
https://github.com/emailjs-com/emailjs-nodejs
https://docs.netlify.com/build/functions/environment-variables/
