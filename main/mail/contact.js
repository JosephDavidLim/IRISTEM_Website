(function () {
  "use strict";

  var form = document.getElementById("contactForm");

  if (!form || !form.hasAttribute("data-netlify")) {
    return;
  }

  var submitButton = document.getElementById("sendMessageButton");
  var status = document.getElementById("contactFormStatus");
  var defaultButtonText = submitButton.textContent.trim();

  function encodeForm(formData) {
    var params = new URLSearchParams();

    formData.forEach(function (value, key) {
      params.append(key, value);
    });

    return params.toString();
  }

  function showStatus(message, type) {
    status.className = "mt-3 alert alert-" + type;
    status.textContent = message;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Sending...";
    status.className = "mt-3";
    status.textContent = "";

    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encodeForm(new FormData(form)),
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Form submission failed");
        }

        form.reset();
        showStatus(
          "Thanks — your message has been sent to the IRISTEM team.",
          "success",
        );
      })
      .catch(function () {
        showStatus(
          "We couldn't send your message. Please try again or email team@iristem.org.",
          "danger",
        );
      })
      .finally(function () {
        submitButton.disabled = false;
        submitButton.textContent = defaultButtonText;
      });
  });
})();
