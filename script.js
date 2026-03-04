/**
 * ============================================================
 *  EMBER & ROAST — ARTISAN COFFEE CO.
 *  script.js
 *  Author: Student Project
 *  Description: Site interactivity including:
 *    - Light / Dark mode toggle
 *    - Cost Calculator (Quick Order section)
 *    - Contact form validation and customer object creation
 * ============================================================
 */

"use strict";

/* ============================================================
   MODULE 1 — LIGHT / DARK MODE TOGGLE
   ============================================================ */

/**
 * Initialises the theme toggle button.
 * Reads any stored user preference from localStorage and
 * applies it on page load, then wires up the click handler.
 */
function initThemeToggle() {
  const body        = document.body;
  const toggleBtn   = document.getElementById("theme-toggle");
  const toggleLabel = document.getElementById("theme-label");

  if (!toggleBtn || !toggleLabel) {
    console.warn("Theme toggle elements not found.");
    return;
  }

  /**
   * Applies a given theme to the page.
   * @param {string} theme - Either "light" or "dark"
   */
  function applyTheme(theme) {
    if (theme === "dark") {
      body.classList.remove("light-mode");
      body.classList.add("dark-mode");
      toggleBtn.setAttribute("aria-pressed", "true");
      toggleLabel.textContent = "Dark";
    } else {
      body.classList.remove("dark-mode");
      body.classList.add("light-mode");
      toggleBtn.setAttribute("aria-pressed", "false");
      toggleLabel.textContent = "Light";
    }
  }

  /* Restore saved preference (defaults to "light") */
  const savedTheme = localStorage.getItem("theme") || "light";
  applyTheme(savedTheme);

  /* Handle click: flip current theme and save preference */
  toggleBtn.addEventListener("click", function () {
    const isDark = body.classList.contains("dark-mode");
    const nextTheme = isDark ? "light" : "dark";
    applyTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
  });
}

/* ============================================================
   MODULE 2 — COST CALCULATOR (QUICK ORDER)
   ============================================================ */

/**
 * Cart state — an array of objects, one per product.
 * Each entry: { id, name, price, qty }
 */
const PRODUCTS = [
  { id: 0, name: "Single-Origin Espresso",   price: 3.50 },
  { id: 1, name: "Cappuccino",               price: 5.00 },
  { id: 2, name: "Cold Brew Concentrate",    price: 6.00 },
  { id: 3, name: "Oat Milk Latte",           price: 5.50 },
  { id: 4, name: "Almond Croissant",         price: 4.00 },
  { id: 5, name: "House Blend Bag (250g)",   price: 18.00 }
];

/* Tax rate (8.5%) */
const TAX_RATE      = 0.085;

/* Flat shipping fee — waived when subtotal >= FREE_SHIP_THRESHOLD */
const SHIPPING_FEE  = 5.99;
const FREE_SHIP_THRESHOLD = 30.00;

/**
 * The cart is a plain object mapping product id → quantity.
 * e.g. { 0: 2, 3: 1 } means 2 espressos + 1 latte.
 */
const cart = {};

/**
 * Formats a number as a USD currency string.
 * @param {number} amount
 * @returns {string} e.g. "$12.50"
 */
function formatCurrency(amount) {
  return "$" + amount.toFixed(2);
}

/**
 * Returns the total quantity of all items currently in the cart.
 * @returns {number}
 */
function cartTotalQty() {
  return Object.values(cart).reduce(function (sum, qty) {
    return sum + qty;
  }, 0);
}

/**
 * Calculates the current subtotal from the cart.
 * @returns {number}
 */
function calcSubtotal() {
  let subtotal = 0;
  for (const id in cart) {
    const product = PRODUCTS[parseInt(id, 10)];
    subtotal += product.price * cart[id];
  }
  return subtotal;
}

/**
 * Determines the shipping cost based on the subtotal.
 * Orders >= FREE_SHIP_THRESHOLD get free shipping.
 * @param {number} subtotal
 * @returns {number}
 */
function calcShipping(subtotal) {
  return subtotal >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_FEE;
}

/**
 * Re-renders the order summary sidebar whenever the cart changes.
 * Updates line items, subtotal, shipping, tax, and grand total.
 */
function renderOrderSummary() {
  const lineItemsContainer = document.getElementById("summary-line-items");
  const emptyMsg           = document.getElementById("cart-empty-msg");
  const subtotalDisplay    = document.getElementById("subtotal-display");
  const shippingDisplay    = document.getElementById("shipping-display");
  const taxDisplay         = document.getElementById("tax-display");
  const totalDisplay       = document.getElementById("total-display");

  if (!lineItemsContainer) return;

  /* Remove any previous dynamic line items */
  const oldLines = lineItemsContainer.querySelectorAll(".cart-line-item");
  oldLines.forEach(function (el) { el.remove(); });

  const subtotal = calcSubtotal();
  const shipping = calcShipping(subtotal);
  const tax      = subtotal * TAX_RATE;
  const total    = subtotal + shipping + tax;

  if (cartTotalQty() === 0) {
    /* Show empty-cart message */
    emptyMsg.hidden = false;
  } else {
    /* Hide empty-cart message and render one line per product in cart */
    emptyMsg.hidden = true;

    PRODUCTS.forEach(function (product) {
      const qty = cart[product.id];
      if (!qty) return; /* Skip products not in cart */

      const lineTotal = product.price * qty;

      /* Build line-item element */
      const lineEl = document.createElement("div");
      lineEl.classList.add("cart-line-item");

      /* Product name + qty */
      const nameSpan = document.createElement("span");
      nameSpan.classList.add("cart-line-item-name");
      nameSpan.textContent = product.name + " × " + qty;

      /* Price for this line */
      const priceSpan = document.createElement("span");
      priceSpan.classList.add("cart-line-item-price");
      priceSpan.textContent = formatCurrency(lineTotal);

      lineEl.appendChild(nameSpan);
      lineEl.appendChild(priceSpan);
      lineItemsContainer.appendChild(lineEl);
    });
  }

  /* Update totals */
  if (subtotalDisplay) subtotalDisplay.textContent = formatCurrency(subtotal);
  if (taxDisplay)      taxDisplay.textContent      = formatCurrency(tax);
  if (totalDisplay)    totalDisplay.textContent    = formatCurrency(total);

  /* Shipping label — show "Free" or the fee amount */
  if (shippingDisplay) {
    shippingDisplay.textContent = shipping === 0 ? "Free" : formatCurrency(shipping);
  }
}

/**
 * Updates the quantity display badge on a product card.
 * Also toggles the "in-cart" class for visual feedback.
 * @param {HTMLElement} card - The product card element
 * @param {number} productId
 */
function updateCardUI(card, productId) {
  const qtyDisplay = card.querySelector(".qty-display");
  if (!qtyDisplay) return;

  const qty = cart[productId] || 0;
  qtyDisplay.textContent = qty;

  /* Highlight card if item is in the cart */
  if (qty > 0) {
    card.classList.add("in-cart");
  } else {
    card.classList.remove("in-cart");
  }
}

/**
 * Handles a click on a + or − quantity button inside a product card.
 * Modifies the cart object and triggers a re-render.
 * @param {MouseEvent} event
 */
function handleQtyClick(event) {
  const btn  = event.target.closest(".qty-btn");
  if (!btn) return;

  const card      = btn.closest(".product-card");
  const productId = parseInt(card.getAttribute("data-product-id"), 10);
  const isPlus    = btn.classList.contains("plus-btn");
  const isMinus   = btn.classList.contains("minus-btn");

  if (isPlus) {
    /* Add one to quantity (no upper limit set — practical stores often cap at 99) */
    cart[productId] = (cart[productId] || 0) + 1;
  } else if (isMinus) {
    /* Remove one, but don't go below 0 */
    if (cart[productId] && cart[productId] > 0) {
      cart[productId] -= 1;
      if (cart[productId] === 0) {
        delete cart[productId]; /* Clean up zero entries */
      }
    }
  }

  /* Update the individual card UI and the summary sidebar */
  updateCardUI(card, productId);
  renderOrderSummary();

  /* Hide any checkout messages that may be showing */
  const checkoutConfirm = document.getElementById("checkout-confirm");
  const cartWarning     = document.getElementById("cart-warning");
  if (checkoutConfirm) checkoutConfirm.hidden = true;
  if (cartWarning)     cartWarning.hidden     = true;
}

/**
 * Handles a click on the Checkout button.
 * Validates that the cart is non-empty, then:
 *   - Displays a thank-you / order confirmation
 *   - Resets the cart and UI
 */
function handleCheckout() {
  const checkoutBtn     = document.getElementById("checkout-btn");
  const checkoutConfirm = document.getElementById("checkout-confirm");
  const cartWarning     = document.getElementById("cart-warning");
  const confirmTotalMsg = document.getElementById("confirm-total-msg");

  if (!checkoutBtn) return;

  /* Validate: cart must not be empty */
  if (cartTotalQty() === 0) {
    if (cartWarning) cartWarning.hidden = false;
    return;
  }

  /* Hide any previous warning */
  if (cartWarning) cartWarning.hidden = true;

  /* Compute totals for the confirmation message */
  const subtotal = calcSubtotal();
  const shipping = calcShipping(subtotal);
  const tax      = subtotal * TAX_RATE;
  const total    = subtotal + shipping + tax;

  /* Display the confirmation */
  if (confirmTotalMsg) {
    confirmTotalMsg.textContent =
      "Your order total was " + formatCurrency(total) + ".";
  }

  if (checkoutConfirm) checkoutConfirm.hidden = false;

  /* Reset cart state */
  for (const key in cart) {
    delete cart[key];
  }

  /* Reset all product card UI */
  document.querySelectorAll(".product-card").forEach(function (card) {
    const productId = parseInt(card.getAttribute("data-product-id"), 10);
    updateCardUI(card, productId);
  });

  /* Re-render the now-empty summary */
  renderOrderSummary();
}

/**
 * Initialises the cost calculator section by attaching event listeners.
 */
function initCostCalculator() {
  const productGrid = document.getElementById("product-grid");
  const checkoutBtn = document.getElementById("checkout-btn");

  if (!productGrid || !checkoutBtn) {
    console.warn("Cost calculator elements not found.");
    return;
  }

  /* Delegated click handler on the grid — handles all +/− buttons */
  productGrid.addEventListener("click", handleQtyClick);

  /* Checkout button */
  checkoutBtn.addEventListener("click", handleCheckout);

  /* Initial render of the empty summary */
  renderOrderSummary();
}

/* ============================================================
   MODULE 3 — CONTACT FORM VALIDATION & CUSTOMER OBJECT
   ============================================================ */

/**
 * Regex patterns used for form field validation.
 */
const REGEX = {
  /* US phone: accepts (xxx) xxx-xxxx, xxx-xxx-xxxx, xxxxxxxxxx, etc. */
  phone: /^\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}$/,
  /* Standard email format: local@domain.tld */
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
};

/**
 * Shows an error message next to a specific form field.
 * Also applies the .has-error class for red border styling.
 *
 * @param {string} fieldId    - The id of the input element
 * @param {string} errorId    - The id of the error <span>
 * @param {string} message    - The descriptive error text to display
 */
function showFieldError(fieldId, errorId, message) {
  const field   = document.getElementById(fieldId);
  const errorEl = document.getElementById(errorId);

  if (field && field.tagName !== "FIELDSET") {
    field.classList.add("has-error");
  }
  if (errorEl) {
    errorEl.textContent = message;
  }
}

/**
 * Clears the error state for a specific form field.
 *
 * @param {string} fieldId  - The id of the input element
 * @param {string} errorId  - The id of the error <span>
 */
function clearFieldError(fieldId, errorId) {
  const field   = document.getElementById(fieldId);
  const errorEl = document.getElementById(errorId);

  if (field) field.classList.remove("has-error");
  if (errorEl) errorEl.textContent = "";
}

/**
 * Validates the entire contact form.
 * Applies inline error messages for invalid/missing fields.
 *
 * @returns {boolean} true if all validation passes, false otherwise
 */
function validateContactForm() {
  let isValid = true;

  /* Retrieve all field values */
  const fullName     = document.getElementById("full-name").value.trim();
  const phone        = document.getElementById("phone").value.trim();
  const email        = document.getElementById("email").value.trim();
  const comments     = document.getElementById("comments").value.trim();
  const selectedPref = document.querySelector("input[name='contactPref']:checked");
  const prefValue    = selectedPref ? selectedPref.value : null;

  /* -- Full Name (required) -- */
  clearFieldError("full-name", "full-name-error");
  if (fullName === "") {
    showFieldError("full-name", "full-name-error", "⚠ Please enter your full name.");
    isValid = false;
  }

  /* -- Contact Preference (required radio) -- */
  clearFieldError(null, "contact-pref-error");
  if (!prefValue) {
    document.getElementById("contact-pref-error").textContent =
      "⚠ Please choose how you'd like to be contacted.";
    isValid = false;
  }

  /* -- Phone (required only if user selected "phone" contact preference) -- */
  clearFieldError("phone", "phone-error");
  if (prefValue === "phone") {
    if (phone === "") {
      showFieldError("phone", "phone-error",
        "⚠ Phone number is required when 'Phone' is selected as contact method.");
      isValid = false;
    } else if (!REGEX.phone.test(phone)) {
      showFieldError("phone", "phone-error",
        "⚠ Please enter a valid 10-digit phone number, e.g. (619) 555-0100.");
      isValid = false;
    }
  }

  /* -- Email (required only if user selected "email" contact preference) -- */
  clearFieldError("email", "email-error");
  if (prefValue === "email") {
    if (email === "") {
      showFieldError("email", "email-error",
        "⚠ Email address is required when 'Email' is selected as contact method.");
      isValid = false;
    } else if (!REGEX.email.test(email)) {
      showFieldError("email", "email-error",
        "⚠ Please enter a valid email address, e.g. jane@example.com.");
      isValid = false;
    }
  }

  /* -- Comments (required) -- */
  clearFieldError("comments", "comments-error");
  if (comments === "") {
    showFieldError("comments", "comments-error",
      "⚠ Please add a message or comment before submitting.");
    isValid = false;
  }

  return isValid;
}

/**
 * Builds and returns a customer object from the submitted form data.
 *
 * @param {string} fullName
 * @param {string} phone
 * @param {string} email
 * @param {string} contactPref  - "phone" | "email"
 * @param {string} comments
 * @returns {Object} customer
 */
function createCustomer(fullName, phone, email, contactPref, comments) {
  const customer = {
    fullName:    fullName,
    phone:       phone    || null,
    email:       email    || null,
    contactPref: contactPref,
    comments:    comments,
    submittedAt: new Date().toISOString()
  };
  return customer;
}

/**
 * Populates and reveals the thank-you message block using
 * the data from the customer object.
 *
 * @param {Object} customer - The object created by createCustomer()
 */
function displayThankYou(customer) {
  const thankYouMsg = document.getElementById("thank-you-msg");
  const tyName      = document.getElementById("ty-name");
  const tyPref      = document.getElementById("ty-pref");
  const tyContact   = document.getElementById("ty-contact");
  const tyComment   = document.getElementById("ty-comment");

  if (!thankYouMsg) return;

  /* Fill in the personalised fields */
  if (tyName)    tyName.textContent    = customer.fullName;
  if (tyPref)    tyPref.textContent    = customer.contactPref;
  if (tyContact) tyContact.textContent =
    customer.contactPref === "email" ? customer.email : customer.phone;
  if (tyComment) tyComment.textContent = "\u201C" + customer.comments + "\u201D";

  /* Show the thank-you block */
  thankYouMsg.hidden = false;

  /* Smooth scroll to the thank-you message */
  thankYouMsg.scrollIntoView({ behavior: "smooth", block: "center" });
}

/**
 * Handles the contact form's submit event.
 * Prevents default submission, validates, creates a customer
 * object if valid, resets the form, and shows the thank-you message.
 *
 * @param {SubmitEvent} event
 */
function handleFormSubmit(event) {
  /* Always prevent native form submission */
  event.preventDefault();

  /* Run validation — abort if any field is invalid */
  if (!validateContactForm()) return;

  /* Collect validated data */
  const fullName    = document.getElementById("full-name").value.trim();
  const phone       = document.getElementById("phone").value.trim();
  const email       = document.getElementById("email").value.trim();
  const comments    = document.getElementById("comments").value.trim();
  const selectedPref = document.querySelector("input[name='contactPref']:checked");
  const contactPref  = selectedPref ? selectedPref.value : "";

  /* Build customer object */
  const customer = createCustomer(fullName, phone, email, contactPref, comments);

  /* Log to console for debugging / grading reference */
  console.log("Customer object created:", customer);

  /* Hide the form and show thank-you message */
  const form = document.getElementById("contact-form");
  if (form) {
    form.reset();
    form.hidden = true;
  }

  displayThankYou(customer);
}

/**
 * Clears error styling on a field as soon as the user starts typing / changing it.
 * Provides a responsive feel during correction.
 */
function addLiveValidationListeners() {
  const fields = [
    { inputId: "full-name",  errorId: "full-name-error"  },
    { inputId: "phone",      errorId: "phone-error"       },
    { inputId: "email",      errorId: "email-error"       },
    { inputId: "comments",   errorId: "comments-error"    }
  ];

  fields.forEach(function (pair) {
    const input = document.getElementById(pair.inputId);
    if (!input) return;

    /* Clear error on every keystroke after first failed submit */
    input.addEventListener("input", function () {
      clearFieldError(pair.inputId, pair.errorId);
    });
  });

  /* Clear radio group error when any radio is selected */
  const radios = document.querySelectorAll("input[name='contactPref']");
  radios.forEach(function (radio) {
    radio.addEventListener("change", function () {
      document.getElementById("contact-pref-error").textContent = "";
    });
  });
}

/**
 * Initialises the contact form by attaching event listeners.
 */
function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) {
    console.warn("Contact form not found.");
    return;
  }

  form.addEventListener("submit", handleFormSubmit);
  addLiveValidationListeners();
}

/* ============================================================
   ENTRY POINT — runs after DOM is fully loaded (defer attribute)
   ============================================================ */

(function init() {
  initThemeToggle();
  initCostCalculator();
  initContactForm();
})();
