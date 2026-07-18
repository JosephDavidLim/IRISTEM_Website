(function () {
  const container = document.getElementById("navbar-inserts-here");

  if (!container) return;

  fetch("navbar.html")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Unable to load navigation: ${response.status}`);
      }

      return response.text();
    })
    .then((html) => {
      const documentFragment = new DOMParser().parseFromString(html, "text/html");
      const navbar = documentFragment.querySelector("#navbar");

      if (!navbar) {
        throw new Error("Unable to find navigation in navbar.html");
      }

      container.innerHTML = navbar.innerHTML;
    })
    .catch((error) => {
      console.warn("Using fallback navigation.", error);
      container.innerHTML = `
        <nav class="navbar navbar-expand bg-dark navbar-dark" aria-label="Primary">
          <div class="container-fluid">
            <a href="index.html" class="navbar-brand">IRISTEM</a>
            <div class="navbar-nav ml-auto">
              <a href="index.html" class="nav-item nav-link">Home</a>
              <a href="contact.html" class="nav-item nav-link">Contact</a>
              <a href="donate.html" class="nav-item nav-link nav-donate">Donate</a>
            </div>
          </div>
        </nav>`;
    });
})();
