// Client-side checks. They give instant feedback, but the Spring Boot API repeats every rule
// (never trust the browser), so the server messages are shown too.

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const USERNAME = /^[A-Za-z0-9._-]+$/;

export function validateEmail(value) {
  if (!value.trim()) return "Email is required";
  if (!EMAIL.test(value.trim())) return "Email is invalid";
  return "";
}

export function validateUsername(value) {
  const text = value.trim();
  if (!text) return "Username is required";
  if (text.length < 3 || text.length > 50) return "Username must be 3-50 characters";
  if (!USERNAME.test(text)) return "Username can only contain letters, numbers, dot, dash and underscore";
  return "";
}

export function validatePassword(value) {
  if (!value) return "Password is required";
  if (value.length < 6 || value.length > 72) return "Password must be 6-72 characters";
  return "";
}

// Keep only the fields that have a message.
export function onlyErrors(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
}

export function validateProduct(form) {
  return onlyErrors({
    name: form.name.trim() ? "" : "Product name is required",
    categoryId: form.categoryId ? "" : "Category is required",
    price: form.price === "" || Number(form.price) < 0 ? "Price must be 0 or more" : "",
    quantity:
      form.quantity === "" || !Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 0
        ? "Quantity must be a whole number, 0 or more"
        : "",
  });
}
