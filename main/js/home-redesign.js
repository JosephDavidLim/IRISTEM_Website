(function () {
    "use strict";

    var menuToggle = document.querySelector("[data-menu-toggle]");
    var menu = document.querySelector("[data-menu]");

    function closeMenu() {
        if (!menuToggle || !menu) return;
        menuToggle.setAttribute("aria-expanded", "false");
        menu.classList.remove("is-open");
        document.body.classList.remove("menu-open");
    }

    if (menuToggle && menu) {
        menuToggle.addEventListener("click", function () {
            var isOpen = menuToggle.getAttribute("aria-expanded") === "true";
            menuToggle.setAttribute("aria-expanded", String(!isOpen));
            menu.classList.toggle("is-open", !isOpen);
            document.body.classList.toggle("menu-open", !isOpen);
        });

        menu.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", closeMenu);
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") closeMenu();
        });

        window.addEventListener("resize", function () {
            if (window.innerWidth > 1050) closeMenu();
        });
    }

    var revealItems = document.querySelectorAll(".reveal");
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!("IntersectionObserver" in window) || reduceMotion) {
        revealItems.forEach(function (item) {
            item.classList.add("is-visible");
        });
    } else {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: "0px 0px -8% 0px",
            threshold: 0.08
        });

        revealItems.forEach(function (item) {
            observer.observe(item);
        });
    }

    document.querySelectorAll("[data-year]").forEach(function (item) {
        item.textContent = new Date().getFullYear();
    });
}());
