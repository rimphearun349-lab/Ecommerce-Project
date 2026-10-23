// Sends the browser to ABA PayWay's hosted checkout page.
// PayWay expects an HTML form POST with the signed fields (the hash is created by our server, never here).
export function submitToPayWay({ actionUrl, fields }) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = actionUrl;

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}
