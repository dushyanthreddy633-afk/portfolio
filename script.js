// Keep the mobile navigation, entrance animations, and resume download in one place.
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const EMAILJS_CONFIG = {
  publicKey: "YOUR_EMAILJS_PUBLIC_KEY",
  serviceId: "YOUR_EMAILJS_SERVICE_ID",
  templateId: "YOUR_EMAILJS_TEMPLATE_ID"
};

function closeMenu() {
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
  navLinks.classList.remove("is-open");
}

menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  menuToggle.setAttribute("aria-label", isExpanded ? "Open navigation menu" : "Close navigation menu");
  navLinks.classList.toggle("is-open", !isExpanded);
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

// Reveal sections as they enter the viewport; show them immediately in older browsers.
const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

// Provide a downloadable starter resume without requiring a separate file.
document.querySelector("#download-resume").addEventListener("click", () => {
  const resume = [
    "M. Dushyanth Reddy",
    "CSE AI & ML Student",
    "Jain (Deemed-to-be University)",
    "Andhra Pradesh, India | USN: 25BTRCL159",
    "Email: dushyanthreddy633@gmail.com | Phone: +91 98499 35935",
    "",
    "PROFILE",
    "Computer Science Engineering student specializing in Artificial Intelligence and Machine Learning. Interested in coding, technology, entrepreneurship, reading, gaming, and travel.",
    "",
    "EDUCATION",
    "Sri Chaitanya School | 91%",
    "Intermediate",
    "B.Tech, Computer Science Engineering — AI & ML",
    "Jain (Deemed-to-be University) | CGPA: 7.435",
    "",
    "TECHNICAL SKILLS",
    "Python, JavaScript, Visual Studio Code, GitHub",
    "",
    "PROJECTS",
    "Programming Foundations — Python and JavaScript learning exercises",
    "Learning Graph Neural Networks — exploring graph-based machine learning",
    "",
    "CAREER GOALS",
    "Build a career in technology and work toward becoming an entrepreneur and business owner."
  ].join("\n");
  const file = new Blob([resume], { type: "text/plain;charset=utf-8" });
  const downloadUrl = URL.createObjectURL(file);
  const downloadLink = document.createElement("a");
  downloadLink.href = downloadUrl;
  downloadLink.download = "M-Dushyanth-Reddy-Resume.txt";
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
});

// Keep the floating back-to-top control out of the way until it is useful.
const backToTopButton = document.querySelector(".back-to-top-floating");
window.addEventListener("scroll", () => {
  backToTopButton.classList.toggle("is-visible", window.scrollY > 500);
}, { passive: true });

backToTopButton.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

const visitorCount = document.querySelector("#visitor-count");
if (visitorCount) {
  if (window.location.protocol === "file:") {
    visitorCount.textContent = "Run the Python app";
    visitorCount.setAttribute("aria-busy", "false");
  } else {
    fetch(new URL("/api/visits", window.location.origin), {
      method: "POST",
      headers: { Accept: "application/json" }
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Visitor counter request failed: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (!Number.isInteger(data.visits) || data.visits < 0) {
          throw new Error("Visitor counter returned an invalid count.");
        }
        visitorCount.textContent = data.visits.toLocaleString();
      })
      .catch((error) => {
        console.error("Could not load the portfolio visitor count:", error);
        visitorCount.textContent = "Unavailable";
      })
      .finally(() => visitorCount.setAttribute("aria-busy", "false"));
  }
}

const contactForm = document.querySelector("#contact-form");
const contactPhone = document.querySelector("#contact-phone");
const contactStatus = document.querySelector("#contact-form-status");
const contactSubmit = contactForm.querySelector('button[type="submit"]');
const contactSubmitLabel = contactSubmit.querySelector(".submit-label");

function validatePhone() {
  const phone = contactPhone.value.trim();
  const isValid = !phone || (/^\+?[\d\s().-]+$/.test(phone) && phone.replace(/\D/g, "").length >= 7 && phone.replace(/\D/g, "").length <= 15);
  contactPhone.setCustomValidity(isValid ? "" : "Enter a valid phone number with 7 to 15 digits.");
}

contactPhone.addEventListener("input", validatePhone);

contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  validatePhone();
  contactStatus.textContent = "";
  contactStatus.className = "form-status";

  if (!contactForm.reportValidity()) return;

  const isConfigured = Object.values(EMAILJS_CONFIG).every((value) => value && !value.startsWith("YOUR_"));
  if (!isConfigured) {
    contactStatus.textContent = "The contact form is not configured yet. Please use the email link while setup is completed.";
    contactStatus.classList.add("is-error");
    return;
  }

  if (!window.emailjs || typeof window.emailjs.send !== "function") {
    contactStatus.textContent = "The email service could not be loaded. Please try again later or email me directly.";
    contactStatus.classList.add("is-error");
    return;
  }

  contactSubmit.disabled = true;
  contactForm.setAttribute("aria-busy", "true");
  contactSubmitLabel.textContent = "Sending...";

  try {
    const formData = new FormData(contactForm);
    await window.emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      {
        from_name: formData.get("from_name"),
        phone: formData.get("phone"),
        reply_to: formData.get("reply_to"),
        subject: formData.get("subject"),
        message: formData.get("message")
      },
      { publicKey: EMAILJS_CONFIG.publicKey }
    );

    contactForm.reset();
    contactPhone.setCustomValidity("");
    contactStatus.textContent = "Thanks for your message! I’ll get back to you soon.";
    contactStatus.classList.add("is-success");
  } catch (error) {
    console.error("EmailJS contact form submission failed:", error);
    contactStatus.textContent = "Your message could not be sent. Please try again or email me directly.";
    contactStatus.classList.add("is-error");
  } finally {
    contactSubmit.disabled = false;
    contactForm.removeAttribute("aria-busy");
    contactSubmitLabel.textContent = "Send Message";
  }
});
